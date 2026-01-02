import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  source_system: string;
  source_entity_type?: string;
  source_entity_id?: string;
  channels?: string[];
  priority?: number;
  action_url?: string;
  action_label?: string;
  action_data?: any;
  scheduled_for?: string;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();

    // 1. Buscar preferências
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', payload.user_id)
      .single();

    // 2. Verificar DND
    const { data: isDND } = await supabase
      .rpc('is_dnd_active', { p_user_id: payload.user_id });

    if (isDND && payload.priority !== 3) {
      payload.scheduled_for = calculateNextTime(prefs);
    }

    // 3. Canais
    let channels = payload.channels || ['in_app'];
    if (prefs) {
      const catPrefs = prefs.preferences[payload.category || 'system'];
      if (catPrefs) {
        channels = filterChannels(channels, catPrefs, prefs);
      }
    }

    // 4. Agrupamento
    let groupKey: string | null = null;
    if (prefs?.grouping_enabled && payload.category) {
      groupKey = `${payload.source_system}:${payload.category}:${payload.user_id}`;
      
      const { data: recent } = await supabase
        .from('notifications')
        .select('id, group_count')
        .eq('group_key', groupKey)
        .eq('is_read', false)
        .gte('created_at', new Date(Date.now() - prefs.grouping_window_minutes * 60000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recent) {
        await supabase
          .from('notifications')
          .update({
            group_count: recent.group_count + 1,
            is_grouped: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recent.id);

        return new Response(
          JSON.stringify({ success: true, grouped: true, notification_id: recent.id }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Criar notificação
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({ ...payload, channels, group_key: groupKey })
      .select()
      .single();

    if (error) throw error;

    // 6. Processar canais
    const deliveryStatus: any = {};
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await sendEmail(notification, prefs);
            deliveryStatus.email = 'sent';
            break;
          case 'push':
            await sendPush(notification);
            deliveryStatus.push = 'sent';
            break;
          case 'sms':
            await sendSMS(notification, prefs);
            deliveryStatus.sms = 'sent';
            break;
          case 'whatsapp':
            await sendWhatsApp(notification, prefs);
            deliveryStatus.whatsapp = 'sent';
            break;
        }
      } catch (err) {
        deliveryStatus[channel] = 'failed';
      }
    }

    await supabase
      .from('notifications')
      .update({ delivered_at: new Date().toISOString(), delivery_status: deliveryStatus })
      .eq('id', notification.id);

    return new Response(
      JSON.stringify({ success: true, notification_id: notification.id, delivery_status: deliveryStatus }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmail(n: any, p: any) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Notificações <noreply@promobrindes.com.br>',
      to: p?.email || n.user_email,
      subject: n.title,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2>${n.title}</h2><p>${n.message}</p>${n.action_url ? `<a href="${n.action_url}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;">${n.action_label || 'Ver'}</a>` : ''}</div>`,
    }),
  });
  if (!res.ok) throw new Error('Email failed');
}

async function sendPush(n: any) {
  console.log('Push:', n.id);
}

async function sendSMS(n: any, p: any) {
  if (!p.phone_number) throw new Error('No phone');
  const auth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: p.phone_number, From: Deno.env.get('TWILIO_PHONE_NUMBER') || '', Body: `${n.title}\n${n.message}` }),
  });
  if (!res.ok) throw new Error('SMS failed');
}

async function sendWhatsApp(n: any, p: any) {
  if (!p.whatsapp_number) throw new Error('No WhatsApp');
  const auth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: `whatsapp:${p.whatsapp_number}`, From: Deno.env.get('TWILIO_WHATSAPP_NUMBER') || '', Body: `*${n.title}*\n${n.message}` }),
  });
  if (!res.ok) throw new Error('WhatsApp failed');
}

function filterChannels(c: string[], cp: any, p: any) {
  return c.filter(ch => {
    switch (ch) {
      case 'email': return p.email_enabled && cp.channels.includes('email');
      case 'push': return p.push_enabled && cp.channels.includes('push');
      case 'sms': return p.sms_enabled && cp.channels.includes('sms');
      case 'whatsapp': return p.whatsapp_enabled && cp.channels.includes('whatsapp');
      default: return true;
    }
  });
}

function calculateNextTime(p: any): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
}
