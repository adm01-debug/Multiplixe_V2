/**
 * Decide como o login com Google deve ser iniciado, por ambiente.
 *
 * O botão "Continuar com Google" chamava o broker do Lovable
 * (`lovable.auth.signInWithOAuth` -> `@lovable.dev/cloud-auth-js`), que usa a rota
 * relativa `/~oauth/initiate`: ela só existe na hospedagem do Lovable. Na produção
 * (Vercel) o botão quebrava. Agora:
 *
 * - host do Lovable (`*.lovable.app` / `*.lovable.dev`): usa o broker, como antes;
 * - qualquer outro host: usa o OAuth nativo do Supabase, mas só quando o provedor
 *   Google está habilitado no projeto (`external.google` de `/auth/v1/settings`);
 * - sem provedor habilitado: o botão não aparece.
 */

export type ModoLoginGoogle = 'broker' | 'supabase' | 'indisponivel';

export type ProvedorSocial = 'google' | 'azure';
export type ProvedoresSociais = Partial<Record<ProvedorSocial, ModoLoginGoogle>>;

const HOST_BROKER_LOVABLE = /(^|\.)lovable\.(app|dev)$/i;

export function usaBrokerLovable(hostname: string): boolean {
  return HOST_BROKER_LOVABLE.test(hostname);
}

export function decidirLoginGoogle(hostname: string, googleHabilitado: boolean): ModoLoginGoogle {
  if (usaBrokerLovable(hostname)) return 'broker';
  return googleHabilitado ? 'supabase' : 'indisponivel';
}

type OpcoesConsulta = {
  url?: string;
  chave?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Lê `/auth/v1/settings` (rota pública, só precisa da chave publicável) e informa se o
 * provedor Google está ligado no Supabase.
 */
export async function googleHabilitadoNoSupabase(opcoes: OpcoesConsulta = {}, provedor: ProvedorSocial = 'google'): Promise<boolean> {
  const url = opcoes.url ?? import.meta.env.VITE_SUPABASE_URL;
  const chave = opcoes.chave ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const fetchImpl = opcoes.fetchImpl ?? fetch;
  if (!url || !chave) return false;
  try {
    const resposta = await fetchImpl(url + '/auth/v1/settings', { headers: { apikey: chave } });
    if (!resposta.ok) return false;
    const config = (await resposta.json()) as { external?: Record<string, boolean | undefined> };
    return config.external?.[provedor] === true;
  } catch {
    return false;
  }
}

/**
 * Resolve, para a UI, como entrar com cada provedor habilitado no projeto.
 * Provedor desligado no Supabase nao entra no resultado (o botao nao aparece).
 *
 * Microsoft usa o provedor `azure` do Supabase: o nome vem do Azure AD, hoje Entra ID.
 */
export async function modosSociaisDisponiveis(
  hostname: string,
  opcoes: OpcoesConsulta = {},
): Promise<ProvedoresSociais> {
  const [google, azure] = await Promise.all([
    googleHabilitadoNoSupabase(opcoes, 'google'),
    googleHabilitadoNoSupabase(opcoes, 'azure'),
  ]);
  const modos: ProvedoresSociais = {};
  const googleModo = decidirLoginGoogle(hostname, google);
  if (googleModo !== 'indisponivel') modos.google = googleModo;
  const azureModo = decidirLoginGoogle(hostname, azure);
  if (azureModo !== 'indisponivel') modos.azure = azureModo;
  return modos;
}