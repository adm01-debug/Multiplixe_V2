import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay();

    // Buscar usuários com digest habilitado no horário atual
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id, digest_time, digest_frequency, digest_days')
      .eq('digest_enabled', true);

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const user of users || []) {
      try {
        // Verificar se é o horário correto
        const digestTime = user.digest_time.slice(0, 5);
        if (digestTime !== currentTime) continue;

        // Para weekly, verificar dia
        if (user.digest_frequency === 'weekly') {
          if (!user.digest_days?.includes(currentDay)) continue;
        }

        // Buscar notificações não lidas das últimas 24h
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('is_read', false)
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false });

        if (!notifications || notifications.length === 0) continue;

        // Agrupar por sistema
        const bySystem: any = {};
        for (const notif of notifications) {
          if (!bySystem[notif.source_system]) {
            bySystem[notif.source_system] = [];
          }
          bySystem[notif.source_system].push(notif);
        }

        // Enviar email digest
        await sendDigestEmail(user.user_id, bySystem, notifications.length);
        sent++;

      } catch (err) {
        console.error(`Erro ao enviar digest para ${user.user_id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function sendDigestEmail(userId: string, bySystem: any, totalCount: number) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  const systemsHTML = Object.entries(bySystem)
    .map(([system, notifications]: [string, any]) => `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1f2937; text-transform: capitalize;">
          ${system} (${notifications.length})
        </h3>
        <ul style="list-style: none; padding: 0;">
          ${notifications.slice(0, 5).map((n: any) => `
            <li style="padding: 10px; background: #f9fafb; margin-bottom: 8px; border-radius: 6px;">
              <strong>${n.title}</strong><br>
              <span style="color: #6b7280; font-size: 14px;">${n.message}</span>
            </li>
          `).join('')}
          ${notifications.length > 5 ? `
            <li style="padding: 10px; color: #6b7280;">
              ... e mais ${notifications.length - 5} notificações
            </li>
          ` : ''}
        </ul>
      </div>
    `).join('');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Notificações <noreply@yourdomain.com>',
      to: userId,
      subject: `Resumo Diário: ${totalCount} notificações`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #111827;">📬 Seu Resumo Diário</h2>
          <p style="color: #6b7280;">
            Você tem ${totalCount} notificações não lidas nas últimas 24 horas.
          </p>
          ${systemsHTML}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Configure suas preferências de notificações no painel de configurações.
          </p>
        </div>
      `,
    }),
  });
}
