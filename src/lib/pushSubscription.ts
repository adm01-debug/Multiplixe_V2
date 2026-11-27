import { supabase } from '@/integrations/supabase/client';

// Converte a chave publica VAPID (base64url) para o formato do pushManager.
export const base64UrlParaBytes = (valor: string): Uint8Array => {
  const texto = valor.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(texto + '='.repeat((4 - (texto.length % 4)) % 4));
  return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
};

export const suportaPush = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const registrarServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!suportaPush()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
};

// Cria (ou reaproveita) a inscricao push e grava no banco, vinculada ao usuario logado.
export const inscreverParaPush = async (): Promise<boolean> => {
  if (!suportaPush()) return false;

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return false;

  const registro = await registrarServiceWorker();
  if (!registro) return false;
  await navigator.serviceWorker.ready;

  const { data: chavePublica } = await supabase.rpc('push_vapid_public_key');
  if (!chavePublica) return false;

  const inscricao =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaBytes(chavePublica as string),
    }));

  const chaves = inscricao.toJSON().keys ?? {};
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return false;

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: sessao.user.id,
      endpoint: inscricao.endpoint,
      p256dh: chaves.p256dh ?? '',
      auth: chaves.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 300),
    },
    { onConflict: 'endpoint' },
  );

  return !error;
};

export const desinscreverDoPush = async (): Promise<boolean> => {
  if (!suportaPush()) return false;
  const registro = await navigator.serviceWorker.getRegistration('/');
  const inscricao = await registro?.pushManager.getSubscription();
  if (!inscricao) return true;
  const endpoint = inscricao.endpoint;
  await inscricao.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return true;
};

export const inscricaoPushAtiva = async (): Promise<boolean> => {
  if (!suportaPush()) return false;
  const registro = await navigator.serviceWorker.getRegistration('/');
  const inscricao = await registro?.pushManager.getSubscription();
  return Boolean(inscricao);
};