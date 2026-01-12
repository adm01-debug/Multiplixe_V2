import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceCheckRequest {
  user_id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
}

interface KnownDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  device_name: string;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

const generateDeviceFingerprint = (userAgent: string): string => {
  // Simple fingerprint based on user agent characteristics
  const ua = userAgent.toLowerCase();
  let fingerprint = '';
  
  // Browser
  if (ua.includes('chrome')) fingerprint += 'chrome-';
  else if (ua.includes('firefox')) fingerprint += 'firefox-';
  else if (ua.includes('safari')) fingerprint += 'safari-';
  else if (ua.includes('edge')) fingerprint += 'edge-';
  else fingerprint += 'other-';
  
  // OS
  if (ua.includes('windows')) fingerprint += 'windows';
  else if (ua.includes('mac')) fingerprint += 'mac';
  else if (ua.includes('linux')) fingerprint += 'linux';
  else if (ua.includes('android')) fingerprint += 'android';
  else if (ua.includes('iphone') || ua.includes('ipad')) fingerprint += 'ios';
  else fingerprint += 'other';
  
  return fingerprint;
};

const getDeviceName = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  let browser = 'Navegador';
  let os = 'Sistema';
  
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return `${browser} em ${os}`;
};

const sendNewDeviceEmail = async (
  email: string, 
  deviceName: string, 
  ipAddress: string,
  loginTime: string
): Promise<boolean> => {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Segurança <security@resend.dev>',
        to: [email],
        subject: '🔔 Novo login detectado na sua conta',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .device-info { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
              .device-info p { margin: 8px 0; }
              .device-info strong { color: #374151; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Alerta de Segurança</h1>
              </div>
              <div class="content">
                <h2>Novo login detectado</h2>
                <p>Detectamos um acesso à sua conta de um novo dispositivo ou localização.</p>
                
                <div class="device-info">
                  <p><strong>📱 Dispositivo:</strong> ${deviceName}</p>
                  <p><strong>🌐 Endereço IP:</strong> ${ipAddress}</p>
                  <p><strong>🕐 Data/Hora:</strong> ${loginTime}</p>
                </div>

                <div class="alert-box">
                  <strong>⚠️ Não foi você?</strong>
                  <p style="margin: 10px 0 0 0;">Se você não reconhece esta atividade, recomendamos que:</p>
                  <ul style="margin: 10px 0;">
                    <li>Altere sua senha imediatamente</li>
                    <li>Ative a autenticação de dois fatores</li>
                    <li>Revise as sessões ativas na sua conta</li>
                  </ul>
                </div>

                <p>Se foi você, pode ignorar este email. Enviamos esta notificação para manter sua conta segura.</p>
              </div>
              <div class="footer">
                <p>Este é um email automático de segurança. Por favor, não responda.</p>
                <p>© 2024 Plataforma de Cursos. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('New device alert email sent successfully to:', email);
    return true;
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, user_email, ip_address, user_agent }: DeviceCheckRequest = await req.json();

    console.log('Checking device for user:', user_id);
    console.log('IP:', ip_address, 'User-Agent:', user_agent);

    const deviceFingerprint = generateDeviceFingerprint(user_agent);
    const deviceName = getDeviceName(user_agent);

    // Check if this device/IP combination is known
    const { data: knownDevices, error: fetchError } = await supabaseClient
      .from('known_devices')
      .select('*')
      .eq('user_id', user_id)
      .or(`device_fingerprint.eq.${deviceFingerprint},ip_address.eq.${ip_address}`);

    if (fetchError) {
      console.error('Error fetching known devices:', fetchError);
      throw fetchError;
    }

    const isNewDevice = !knownDevices || knownDevices.length === 0;
    const isNewIP = knownDevices && knownDevices.length > 0 && 
      !knownDevices.some((d: KnownDevice) => d.ip_address === ip_address);

    console.log('Is new device:', isNewDevice, 'Is new IP:', isNewIP);

    if (isNewDevice || isNewIP) {
      // This is a new device or new IP - send alert
      const loginTime = new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'full',
        timeStyle: 'short'
      });

      // Send email notification
      await sendNewDeviceEmail(user_email, deviceName, ip_address, loginTime);

      // Create security alert
      await supabaseClient.from('security_alerts').insert({
        user_id,
        alert_type: isNewDevice ? 'new_device' : 'new_ip',
        severity: 'medium',
        title: isNewDevice ? 'Novo dispositivo detectado' : 'Novo IP detectado',
        description: `Login de ${deviceName} (IP: ${ip_address})`,
        ip_address,
        metadata: { user_agent, device_fingerprint: deviceFingerprint }
      });

      // Add device to known devices
      if (isNewDevice) {
        await supabaseClient.from('known_devices').insert({
          user_id,
          device_fingerprint: deviceFingerprint,
          ip_address,
          user_agent,
          device_name: deviceName,
          is_trusted: false
        });
      } else if (isNewIP) {
        // Update the existing device with new IP
        await supabaseClient
          .from('known_devices')
          .update({ 
            ip_address, 
            last_seen_at: new Date().toISOString() 
          })
          .eq('user_id', user_id)
          .eq('device_fingerprint', deviceFingerprint);
      }

      return new Response(
        JSON.stringify({ 
          is_new_device: isNewDevice,
          is_new_ip: isNewIP,
          alert_sent: true,
          message: 'New device/IP detected, alert sent'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Known device - update last seen
      await supabaseClient
        .from('known_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('device_fingerprint', deviceFingerprint);

      return new Response(
        JSON.stringify({ 
          is_new_device: false,
          is_new_ip: false,
          alert_sent: false,
          message: 'Known device, no alert needed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error in detect-new-device function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
