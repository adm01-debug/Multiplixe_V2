// Assinatura HMAC-SHA256 das entregas de webhook e cálculo de backoff.
// Isolado do handler para poder ser testado com `deno test`.

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const encoder = new TextEncoder();

export const assinar = async (corpo: string, secret: string) => {
  const chave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, encoder.encode(corpo));
  return `sha256=${hex(assinatura)}`;
};

// minutos de espera antes da proxima tentativa (indice = tentativas ja feitas)
export const BACKOFF_MIN = [1, 5, 15, 60, 240];

export const proximaTentativa = (tentativas: number, agora = Date.now()) => {
  const minutos = BACKOFF_MIN[Math.min(tentativas, BACKOFF_MIN.length - 1)];
  return new Date(agora + minutos * 60_000).toISOString();
};