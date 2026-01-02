import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    // Buscar notificações agendadas que já devem ser enviadas
    const { data: scheduled, error } = await supabase
      .from('notifications')
      .select('*')
      .lte('scheduled_for', now)
      .is('delivered_at', null)
      .limit(100);

    if (error) throw error;

    let processed = 0;
    let failed = 0;

    for (const notif of scheduled || []) {
      try {
        // Enviar cada notificação
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notif),
          }
        );

        if (response.ok) {
          processed++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Erro ao processar notificação ${notif.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        failed,
        total: (scheduled || []).length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
