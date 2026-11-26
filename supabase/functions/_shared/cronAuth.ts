// Guarda das edges disparadas por cron.
//
// As duas rodam com verify_jwt = false e a anon key vai no bundle do site, então sem esta
// checagem qualquer visitante conseguia disparar entregas de webhook e e-mails do digest.
// O cron envia o segredo `cron_secret` (guardado no Vault) como Bearer; o mesmo valor fica
// na variável CRON_SECRET da edge. Sem CRON_SECRET configurado a edge recusa tudo (fail closed).
const resposta = (status: number, erro: string) =>
  new Response(JSON.stringify({ error: erro }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const exigirSegredoDoCron = (req: Request): Response | null => {
  if (req.method === "OPTIONS") return null;
  const esperado = Deno.env.get("CRON_SECRET");
  if (!esperado) return resposta(500, "CRON_SECRET not configured");
  const enviado = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (enviado !== esperado) return resposta(401, "unauthorized");
  return null;
};