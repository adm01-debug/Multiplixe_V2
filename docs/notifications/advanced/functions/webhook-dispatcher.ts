import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_type, notification } = await req.json();

    // Buscar webhooks ativos para este evento
    const { data: webhooks, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event_type]);

    if (error) throw error;

    let dispatched = 0;
    let failed = 0;

    for (const webhook of webhooks || []) {
      try {
        const payload = {
          event: event_type,
          timestamp: new Date().toISOString(),
          data: notification,
        };

        // Gerar HMAC signature
        const signature = webhook.secret
          ? createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex')
          : null;

        // Enviar webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Webhook-Signature': signature }),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        const success = response.ok;
        
        // Registrar log
        await supabase.from('webhook_logs').insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          status_code: response.status,
          response_body: await response.text(),
          success,
          attempt_number: 1,
        });

        // Atualizar estatísticas
        await supabase
          .from('webhook_configs')
          .update({
            last_triggered_at: new Date().toISOString(),
            total_calls: webhook.total_calls + 1,
            failed_calls: success ? webhook.failed_calls : webhook.failed_calls + 1,
          })
          .eq('id', webhook.id);

        if (success) {
          dispatched++;
        } else {
          failed++;
          // Retry logic (se necessário)
          if (webhook.max_retries > 0) {
            await scheduleRetry(webhook, payload, 1);
          }
        }

      } catch (err) {
        console.error(`Erro webhook ${webhook.id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, dispatched, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function scheduleRetry(webhook: any, payload: any, attemptNumber: number) {
  // Implementar retry com backoff exponencial
  const delay = webhook.retry_delay_seconds * Math.pow(2, attemptNumber - 1);
  
  // Agendar retry (pode usar uma queue ou scheduled function)
  console.log(`Retry agendado para ${webhook.id} em ${delay}s`);
}
