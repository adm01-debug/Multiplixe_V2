import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Ações que exigem a Admin API do GoTrue (auth.users) e por isso só podem rodar aqui, com
// SERVICE_ROLE_KEY. O cliente nunca vê a service key: ele manda o próprio JWT e o papel
// 'admin' é conferido no servidor, no padrão de approve-password-reset.
//
//   deactivate  -> bane a conta no GoTrue (impede login), derruba sessões e marca o perfil
//   reactivate  -> remove o ban e reabre o perfil
//
// Redefinição de senha NÃO passa por aqui de propósito: o fluxo auditado já existe
// (password_reset_requests + approve-password-reset) e a UI do admin reaproveita ele.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ~100 anos: o desbloqueio é sempre explícito, pelo admin.
const BAN_DURATION = "876000h";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function validateInput(body: unknown): { action: "deactivate" | "reactivate"; userId: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }
  const { action, userId } = body as Record<string, unknown>;

  if (action !== "deactivate" && action !== "reactivate") {
    throw new Error("action must be 'deactivate' or 'reactivate'");
  }
  if (typeof userId !== "string" || !UUID_RE.test(userId)) {
    throw new Error("Invalid userId");
  }

  return { action, userId };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No authorization header" }, 401);
    }

    const { data: { user }, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return json({ error: "Admin access required" }, 403);
    }

    let parsed: { action: "deactivate" | "reactivate"; userId: string };
    try {
      parsed = validateInput(await req.json());
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : "Invalid request";
      return json({ error: message }, 400);
    }

    const { action, userId } = parsed;

    if (userId === user.id) {
      return json({ error: "Não é possível desativar a própria conta" }, 400);
    }

    const { data: targetProfile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!targetProfile) {
      return json({ error: "Usuário não encontrado" }, 404);
    }

    if (action === "deactivate") {
      const { error: banError } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: BAN_DURATION,
      });

      if (banError) {
        return json({ error: `Falha ao bloquear o acesso: ${banError.message}` }, 500);
      }

      // Derruba as sessões abertas: sem isso o usuário continua logado até o token expirar.
      try {
        await admin.auth.admin.signOut(userId, "global");
      } catch {
        // best effort: o ban já impede novos logins
      }

      const { error: profileError } = await admin
        .from("profiles")
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (profileError) {
        return json({ error: `Acesso bloqueado, mas o perfil não foi atualizado: ${profileError.message}` }, 500);
      }

      return json({ success: true, is_active: false, message: "Usuário desativado" });
    }

    const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (unbanError) {
      return json({ error: `Falha ao liberar o acesso: ${unbanError.message}` }, 500);
    }

    const { error: reactivateError } = await admin
      .from("profiles")
      .update({ is_active: true, deactivated_at: null })
      .eq("user_id", userId);

    if (reactivateError) {
      return json({ error: `Acesso liberado, mas o perfil não foi atualizado: ${reactivateError.message}` }, 500);
    }

    return json({ success: true, is_active: true, message: "Usuário reativado" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return json({ error: errorMessage }, 500);
  }
});