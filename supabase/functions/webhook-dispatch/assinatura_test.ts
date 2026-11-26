// `deno test supabase/functions/webhook-dispatch/assinatura_test.ts`
import { assinar, proximaTentativa, BACKOFF_MIN } from "./assinatura.ts";

const iguais = (a: unknown, b: unknown) => {
  if (a !== b) throw new Error(`esperado ${String(b)}, recebido ${String(a)}`);
};

Deno.test("assina o corpo com HMAC-SHA256 no formato sha256=<hex>", async () => {
  const assinatura = await assinar("corpo", "segredo");
  iguais(assinatura.length, "sha256=".length + 64);
  iguais(/^sha256=[0-9a-f]{64}$/.test(assinatura), true);

  // vetor conhecido, conferido com `crypto.createHmac("sha256", "chave").update("texto")`
  iguais(await assinar("texto", "chave"), "sha256=58ce5ea46e20808e73f4880569eb79ee3864aec8eab3e180c4e9e2c10cca6610");
});

Deno.test("assinatura muda quando o corpo ou o segredo mudam", async () => {
  const a = await assinar("corpo", "segredo");
  const b = await assinar("corpo2", "segredo");
  const c = await assinar("corpo", "segredo2");
  iguais(a === b, false);
  iguais(a === c, false);
  iguais(a, await assinar("corpo", "segredo"));
});

Deno.test("backoff cresce e satura no ultimo valor", () => {
  const base = Date.parse("2026-11-26T12:00:00.000Z");
  iguais(proximaTentativa(0, base), "2026-11-26T12:01:00.000Z");
  iguais(proximaTentativa(1, base), "2026-11-26T12:05:00.000Z");
  iguais(proximaTentativa(2, base), "2026-11-26T12:15:00.000Z");
  iguais(proximaTentativa(3, base), "2026-11-26T13:00:00.000Z");
  iguais(proximaTentativa(4, base), "2026-11-26T16:00:00.000Z");
  iguais(proximaTentativa(99, base), "2026-11-26T16:00:00.000Z");
  iguais(BACKOFF_MIN.length, 5);
});