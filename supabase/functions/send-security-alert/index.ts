import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  ip_address?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AlertPayload = await req.json();

    console.log('Creating security alert:', payload);

    // Validate required fields
    if (!payload.alert_type || !payload.title) {
      throw new Error('alert_type and title are required');
    }

    // Insert the alert
    const { data: alert, error: insertError } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: payload.alert_type,
        severity: payload.severity || 'medium',
        title: payload.title,
        description: payload.description,
        ip_address: payload.ip_address,
        user_id: payload.user_id,
        metadata: payload.metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Security alert created:', alert.id);

    // If high/critical severity, notify all admins
    if (payload.severity === 'high' || payload.severity === 'critical') {
      // Get all admin users
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        // Create notifications for all admins
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          title: `🚨 Alerta de Segurança: ${payload.title}`,
          message: payload.description || 'Um evento de segurança foi detectado.',
          type: 'security_alert',
          action_url: '/admin/security',
        }));

        await supabase.from('notifications').insert(notifications);
        console.log(`Notified ${admins.length} admins about security alert`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alert_id: alert.id,
        message: 'Security alert created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-security-alert:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
