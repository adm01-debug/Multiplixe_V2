import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validateInput(body: unknown): { requestId: string; action: "approve" | "reject"; notes?: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }
  const { requestId, action, notes } = body as Record<string, unknown>;

  if (typeof requestId !== "string" || !requestId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error("Invalid requestId");
  }
  if (action !== "approve" && action !== "reject") {
    throw new Error("action must be 'approve' or 'reject'");
  }
  if (notes !== undefined && typeof notes !== "string") {
    throw new Error("notes must be a string");
  }

  return { requestId, action, notes: typeof notes === "string" ? notes.slice(0, 1000) : undefined };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const rawBody = await req.json();
    const { requestId, action, notes } = validateInput(rawBody);

    const { data: resetRequest, error: fetchError } = await supabase
      .from("password_reset_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !resetRequest) {
      throw new Error("Reset request not found");
    }

    if (resetRequest.status !== "pending") {
      throw new Error("Request already processed");
    }

    const updateData: Record<string, unknown> = {
      status: action === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewer_notes: notes || null,
    };

    if (action === "approve") {
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: resetRequest.user_email,
        options: {
          redirectTo: `${Deno.env.get("APP_PUBLIC_URL") || "https://multiplixe-v2.vercel.app"}/reset-password`,
        },
      });

      if (resetError) {
        throw new Error("Failed to generate reset link");
      }

      const resetLink = resetData.properties?.action_link;

      if (resendApiKey && resetLink) {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: "MULTIPLIXE <onboarding@resend.dev>",
          to: [resetRequest.user_email],
          subject: "Redefinição de Senha Aprovada - MULTIPLIXE",
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Redefinição de Senha</title></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">MULTIPLIXE</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Redefinição de Senha</p>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá${resetRequest.user_name ? ` ${resetRequest.user_name}` : ''},</p>
                <p>Sua solicitação de redefinição de senha foi <strong style="color: #22c55e;">aprovada</strong>.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Redefinir Minha Senha
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
                <p style="color: #666; font-size: 14px;">Se você não solicitou esta redefinição, ignore este email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">MULTIPLIXE - Plataforma de Treinamento Corporativo</p>
              </div>
            </body>
            </html>
          `,
        });

        updateData.reset_token_sent_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabase
      .from("password_reset_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      throw updateError;
    }

    if (action === "reject") {
      await supabase.rpc("create_notification", {
        p_user_id: resetRequest.user_id,
        p_title: "Solicitação de Reset de Senha Rejeitada",
        p_message: notes || "Sua solicitação de redefinição de senha foi rejeitada. Entre em contato com o suporte.",
        p_type: "warning",
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: action === "approve" 
          ? "Solicitação aprovada e email enviado" 
          : "Solicitação rejeitada" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
