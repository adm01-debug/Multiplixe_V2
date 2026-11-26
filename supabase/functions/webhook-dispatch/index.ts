// INT-004: entrega os webhooks enfileirados em public.webhook_deliveries.
// Assina o corpo com HMAC-SHA256 (header X-Multiplixe-Signature) e retenta com backoff.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { assinar, proximaTentativa } from "./assinatura.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOTE = 25;
const MAX_TENTATIVAS = 5;
const TIMEOUT_MS = 8000;
const IDADE_MAXIMA_DIAS = 7;

interface Pendente {
  id: string;
  endpoint_id: string;
  evento: string;
  payload: Record<string, unknown>;
  tentativas: number;
  webhook_endpoints: { url: string; secret: string; is_active: boolean } | null;
}

type Supa = ReturnType<typeof criarCliente>;

const criarCliente = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const entregar = async (supabase: Supa, entrega: Pendente) => {
  const endpoint = entrega.webhook_endpoints;

  if (!endpoint || !endpoint.is_active) {
    await supabase
      .from("webhook_deliveries")
      .update({ status: "falhou", erro: "endpoint removido ou desativado", tentativas: entrega.tentativas + 1 })
      .eq("id", entrega.id);
    return "falha" as const;
  }

  const corpo = JSON.stringify({
    id: entrega.id,
    evento: entrega.evento,
    ocorrido_em: entrega.payload?.ocorrido_em ?? null,
    dados: entrega.payload ?? {},
  });

  const tentativas = entrega.tentativas + 1;

  try {
    const resposta = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Multiplixe-Webhooks/1.0",
        "X-Multiplixe-Evento": entrega.evento,
        "X-Multiplixe-Entrega": entrega.id,
        "X-Multiplixe-Signature": await assinar(corpo, endpoint.secret),
      },
      body: corpo,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (resposta.ok) {
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "entregue",
          tentativas,
          resposta_status: resposta.status,
          entregue_em: new Date().toISOString(),
          erro: null,
        })
        .eq("id", entrega.id);
      return "entrega" as const;
    }

    const texto = (await resposta.text().catch(() => "")).slice(0, 300);
    await supabase
      .from("webhook_deliveries")
      .update({
        status: tentativas >= MAX_TENTATIVAS ? "falhou" : "pendente",
        tentativas,
        resposta_status: resposta.status,
        erro: `HTTP ${resposta.status}${texto ? `: ${texto}` : ""}`,
        proxima_tentativa: proximaTentativa(tentativas),
      })
      .eq("id", entrega.id);
    return "falha" as const;
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "erro desconhecido";
    await supabase
      .from("webhook_deliveries")
      .update({
        status: tentativas >= MAX_TENTATIVAS ? "falhou" : "pendente",
        tentativas,
        erro: mensagem.slice(0, 300),
        proxima_tentativa: proximaTentativa(tentativas),
      })
      .eq("id", entrega.id);
    return "falha" as const;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = criarCliente();

    const limite = new Date(Date.now() - IDADE_MAXIMA_DIAS * 86400_000).toISOString();

    // Entregas antigas que nunca passaram do limite de tentativas param aqui.
    await supabase
      .from("webhook_deliveries")
      .update({ status: "falhou", erro: "expirada sem sucesso em 7 dias" })
      .eq("status", "pendente")
      .lt("created_at", limite);

    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select("id, endpoint_id, evento, payload, tentativas, webhook_endpoints(url, secret, is_active)")
      .eq("status", "pendente")
      .lte("proxima_tentativa", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(LOTE);

    if (error) return json({ error: error.message }, 500);

    const pendentes = (data ?? []) as unknown as Pendente[];
    if (!pendentes.length) return json({ ok: true, processados: 0, entregues: 0, falhas: 0 });

    const resultados = await Promise.all(pendentes.map((entrega) => entregar(supabase, entrega)));
    const entregues = resultados.filter((r) => r === "entrega").length;

    return json({
      ok: true,
      processados: pendentes.length,
      entregues,
      falhas: pendentes.length - entregues,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "erro desconhecido" }, 500);
  }
});