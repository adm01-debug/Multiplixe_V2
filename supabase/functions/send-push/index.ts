// Entrega as notificacoes em public.notifications por Web Push, para o aluno receber
// com o app fechado. Chamada pelo cron (segredo do Vault).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { exigirSegredoDoCron } from "../_shared/cronAuth.ts";
import { enviarPush } from "../_shared/webPush.ts";

const resposta = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const recusa = exigirSegredoDoCron(req);
  if (recusa) return recusa;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // A chave privada VAPID fica no Vault; só a edge (service_role) consegue ler.
  const { data: chavePrivada, error: erroSegredo } = await admin.rpc("push_chave_privada");
  if (erroSegredo || !chavePrivada) return resposta(500, { error: "vapid_private_key not configured" });

  const { data: chavePublica } = await admin.rpc("push_vapid_public_key");
  const assunto = Deno.env.get("PUSH_VAPID_SUBJECT") ?? "mailto:contato@promobrindes.com.br";
  const vapid = { assunto, privada: chavePrivada as string, publica: chavePublica as string };

  const { data: pendentes, error } = await admin
    .from("notifications")
    .select("id, user_id, title, message, action_url")
    .is("pushed_at", null)
    .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("created_at")
    .limit(50);
  if (error) return resposta(500, { error: error.message });

  let enviadas = 0;
  let removidas = 0;

  for (const aviso of pendentes ?? []) {
    const { data: inscricoes } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", aviso.user_id);

    for (const inscricao of inscricoes ?? []) {
      const resultado = await enviarPush(
        { endpoint: inscricao.endpoint, p256dh: inscricao.p256dh, auth: inscricao.auth },
        { title: aviso.title, body: aviso.message ?? "", url: aviso.action_url ?? "/dashboard" },
        vapid,
      );

      if (resultado.ok) {
        enviadas += 1;
        await admin
          .from("push_subscriptions")
          .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
          .eq("id", inscricao.id);
      } else if (resultado.status === 404 || resultado.status === 410) {
        // Inscricao morta (app desinstalado / permissao revogada): sai da tabela.
        removidas += 1;
        await admin.from("push_subscriptions").delete().eq("id", inscricao.id);
      } else {
        await admin.rpc("registrar_falha_push", { p_subscription_id: inscricao.id });
      }
    }

    if ((inscricoes ?? []).length > 0) {
      await admin.from("notifications").update({ pushed_at: new Date().toISOString() }).eq("id", aviso.id);
    }
  }

  return resposta(200, { processadas: (pendentes ?? []).length, enviadas, removidas });
});