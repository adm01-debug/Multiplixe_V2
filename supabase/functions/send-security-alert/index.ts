import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

function validateInput(body: unknown): {
  alert_type: string;
  severity: typeof VALID_SEVERITIES[number];
  title: string;
  description?: string;
  ip_address?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }
  const payload = body as Record<string, unknown>;

  if (typeof payload.alert_type !== "string" || payload.alert_type.length === 0 || payload.alert_type.length > 100) {
    throw new Error("alert_type is required (max 100 chars)");
  }
  if (typeof payload.title !== "string" || payload.title.length === 0 || payload.title.length > 500) {
    throw new Error("title is required (max 500 chars)");
  }
  const severity = typeof payload.severity === "string" && VALID_SEVERITIES.includes(payload.severity as typeof VALID_SEVERITIES[number])
    ? payload.severity as typeof VALID_SEVERITIES[number]
    : 'medium';

  if (payload.user_id !== undefined && (typeof payload.user_id !== "string" || !payload.user_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))) {
    throw new Error("Invalid user_id format");
  }

  return {
    alert_type: payload.alert_type,
    severity,
    title: payload.title,
    description: typeof payload.description === "string" ? payload.description.slice(0, 2000) : undefined,
    ip_address: typeof payload.ip_address === "string" ? payload.ip_address.slice(0, 45) : undefined,
    user_id: payload.user_id as string | undefined,
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata as Record<string, unknown> : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    const payload = validateInput(rawBody);

    // Usuario comum so registra alerta sobre a propria conta; apontar para outra
    // conta e prerrogativa de admin.
    const alvo = payload.user_id ?? userData.user.id;

    if (alvo !== userData.user.id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Apenas administradores podem registrar alerta para outra conta',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    const { data: alert, error: insertError } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: payload.alert_type,
        severity: payload.severity,
        title: payload.title,
        description: payload.description,
        ip_address: payload.ip_address,
        user_id: alvo,
        metadata: payload.metadata,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (payload.severity === 'high' || payload.severity === 'critical') {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          title: `🚨 Alerta de Segurança: ${payload.title}`,
          message: payload.description || 'Um evento de segurança foi detectado.',
          type: 'security_alert',
          action_url: '/admin/security',
        }));

        await supabase.from('notifications').insert(notifications);
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
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
