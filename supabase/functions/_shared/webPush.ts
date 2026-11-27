// Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) sem biblioteca externa: só crypto.subtle,
// que o Deno e o Node moderno já têm. Com a chave VAPID trocada, as inscrições antigas
// passam a falhar com 403 e são removidas pelo chamador.

const utf8 = (v: string) => new TextEncoder().encode(v);

export const base64UrlParaBytes = (valor: string): Uint8Array => {
  const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const comPadding = normalizado + "=".repeat((4 - (normalizado.length % 4)) % 4);
  const binario = atob(comPadding);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return bytes;
};

export const bytesParaBase64Url = (bytes: Uint8Array): string => {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const concat = (...partes: Uint8Array[]): Uint8Array => {
  const total = partes.reduce((soma, p) => soma + p.length, 0);
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const parte of partes) {
    saida.set(parte, pos);
    pos += parte.length;
  }
  return saida;
};

interface Inscricao {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface OpcoesVapid {
  assunto: string;
  publica: string;
  privada: string;
}

const assinarVapid = async (endpoint: string, chave: OpcoesVapid): Promise<{ authorization: string; crypto: string }> => {
  const audiencia = new URL(endpoint).origin;
  // O JWK exige x/y junto do d; a chave publica guardada em push_vapid_public_key() ja tem os dois.
  const publica = base64UrlParaBytes(chave.publica);
  const xPublico = bytesParaBase64Url(publica.subarray(1, 33));
  const yPublico = bytesParaBase64Url(publica.subarray(33, 65));
  const cabecalho = bytesParaBase64Url(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corpo = bytesParaBase64Url(
    utf8(JSON.stringify({ aud: audiencia, exp: Math.floor(Date.now() / 1000) + 12 * 60, sub: chave.assunto })),
  );
  const paraAssinar = `${cabecalho}.${corpo}`;

  const privada = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: chave.privada, x: xPublico, y: yPublico, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const assinaturaDer = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privada, utf8(paraAssinar)),
  );
  // Web Crypto devolve a assinatura em DER; o VAPID (RFC 8292) exige r||s.
  const assinatura = assinaturaDer.length === 64 ? assinaturaDer : derParaConcat(assinaturaDer);

  return {
    authorization: `vapid t=${paraAssinar}.${bytesParaBase64Url(assinatura)}, k=${chave.publica}`,
    crypto: `p256ecdsa=${chave.publica}`,
  };
};

const derParaConcat = (der: Uint8Array): Uint8Array => {
  const tamanhoR = der[3];
  const inicioR = 4;
  const tamanhoS = der[5 + tamanhoR - 1];
  const inicioS = 6 + tamanhoR;
  const saida = new Uint8Array(64);
  saida.set(der.subarray(inicioR, inicioR + tamanhoR), 32 - tamanhoR);
  saida.set(der.subarray(inicioS, inicioS + tamanhoS), 64 - tamanhoS);
  return saida;
};

// RFC 8188: o HKDF do conteudo usa o 16o byte do sal como separador de contexto.
const CONTEXTO_AES = Uint8Array.from([0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x2d, 0x45, 0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x3a, 0x20, 0x61, 0x65, 0x73, 0x31, 0x32, 0x38, 0x67, 0x63, 0x6d]);
const CONTEXTO_NONCE = Uint8Array.from([0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x2d, 0x45, 0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x3a, 0x20, 0x6e, 0x6f, 0x6e, 0x63, 0x65]);

const hkdf = async (sal: Uint8Array, ikm: Uint8Array, info: Uint8Array, tamanho: number): Promise<Uint8Array> => {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sal, info }, base, tamanho * 8);
  return new Uint8Array(bits);
};

const cifrar = async (inscricao: Inscricao, payload: string): Promise<Uint8Array> => {
  const chaveServidor = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const publicaServidor = new Uint8Array(await crypto.subtle.exportKey("raw", chaveServidor.publicKey));
  const publicaCliente = new Uint8Array(base64UrlParaBytes(inscricao.p256dh));
  const chaveCliente = await crypto.subtle.importKey(
    "raw",
    publicaCliente,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const segredo = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: chaveCliente }, chaveServidor.privateKey, 256),
  );

  // RFC 8291: o segredo ECDH entra no HKDF junto com a chave do cliente, e o auth direto e o sal.
  const auth = base64UrlParaBytes(inscricao.auth);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const material = await hkdf(
    auth,
    segredo,
    concat(utf8("WebPush: info\0"), publicaCliente, publicaServidor),
    32,
  );
  const chaveConteudo = await hkdf(sal, material, concat(CONTEXTO_AES, new Uint8Array([0])), 16);
  const nonce = await hkdf(sal, material, concat(CONTEXTO_NONCE, new Uint8Array([0])), 12);

  const aes = await crypto.subtle.importKey("raw", chaveConteudo, "AES-GCM", false, ["encrypt"]);
  // 0x02 = delimitador final do registro (RFC 8188).
  const corpo = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, concat(utf8(payload), new Uint8Array([2]))));

  const cabecalho = new Uint8Array(16 + 4 + 1 + publicaServidor.length);
  cabecalho.set(sal, 0);
  new DataView(cabecalho.buffer).setUint32(16, 4096, false);
  cabecalho[20] = publicaServidor.length;
  cabecalho.set(publicaServidor, 21);

  return concat(cabecalho, corpo);
};

export const enviarPush = async (
  inscricao: Inscricao,
  mensagem: { title: string; body: string; url?: string; icon?: string },
  vapid: OpcoesVapid,
): Promise<{ ok: boolean; status: number }> => {
  try {
    const corpo = await cifrar(inscricao, JSON.stringify(mensagem));
    const jwt = await assinarVapid(inscricao.endpoint, vapid);
    const resposta = await fetch(inscricao.endpoint, {
      method: "POST",
      headers: {
        Authorization: jwt.authorization,
        "Crypto-Key": jwt.crypto,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "normal",
      },
      body: corpo,
    });
    return { ok: resposta.ok || resposta.status === 201, status: resposta.status };
  } catch (erro) {
    return { ok: false, status: 0 };
  }
};