import { describe, it, expect, vi } from 'vitest';
import { decidirLoginGoogle, googleHabilitadoNoSupabase, modosSociaisDisponiveis, usaBrokerLovable } from '@/lib/socialLogin';

describe('usaBrokerLovable', () => {
  it('reconhece os hosts do Lovable', () => {
    expect(usaBrokerLovable('learn-flow-forge-37.lovable.app')).toBe(true);
    expect(usaBrokerLovable('lovable.dev')).toBe(true);
  });

  it('nao confunde outros hosts com o Lovable', () => {
    expect(usaBrokerLovable('multiplixe-v2-juca1.vercel.app')).toBe(false);
    expect(usaBrokerLovable('lovable.app.evil.com')).toBe(false);
    expect(usaBrokerLovable('evil-lovable.app')).toBe(false);
    expect(usaBrokerLovable('localhost')).toBe(false);
  });
});

describe('decidirLoginGoogle', () => {
  it('usa o broker no host do Lovable mesmo sem provedor no Supabase', () => {
    expect(decidirLoginGoogle('loja.lovable.app', false)).toBe('broker');
  });

  it('usa o OAuth nativo quando o provedor esta habilitado', () => {
    expect(decidirLoginGoogle('multiplixe-v2-juca1.vercel.app', true)).toBe('supabase');
  });

  it('esconde o botao quando nao ha como entrar (hoje, na Vercel)', () => {
    expect(decidirLoginGoogle('multiplixe-v2-juca1.vercel.app', false)).toBe('indisponivel');
    expect(decidirLoginGoogle('localhost', false)).toBe('indisponivel');
  });
});

describe('googleHabilitadoNoSupabase', () => {
  const resposta = (corpo: unknown, ok = true) => ({ ok, json: async () => corpo }) as Response;

  it('le external.google de /auth/v1/settings', async () => {
    const fetchImpl = vi.fn(async () => resposta({ external: { google: true } }));
    await expect(googleHabilitadoNoSupabase({ url: 'https://projeto.supabase.co', chave: 'sb_publishable_x', fetchImpl: fetchImpl as unknown as typeof fetch })).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('https://projeto.supabase.co/auth/v1/settings', { headers: { apikey: 'sb_publishable_x' } });
  });

  it('trata google desligado, resposta com erro e falha de rede como indisponivel', async () => {
    const desligado = vi.fn(async () => resposta({ external: { google: false } }));
    await expect(googleHabilitadoNoSupabase({ url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: desligado as unknown as typeof fetch })).resolves.toBe(false);

    const comErro = vi.fn(async () => resposta({}, false));
    await expect(googleHabilitadoNoSupabase({ url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: comErro as unknown as typeof fetch })).resolves.toBe(false);

    const quebrado = vi.fn(async () => { throw new Error('sem rede'); });
    await expect(googleHabilitadoNoSupabase({ url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: quebrado as unknown as typeof fetch })).resolves.toBe(false);
  });

  it('nao consulta nada sem url ou chave', async () => {
    const fetchImpl = vi.fn(async () => resposta({ external: { google: true } }));
    await expect(googleHabilitadoNoSupabase({ url: '', chave: '', fetchImpl: fetchImpl as unknown as typeof fetch })).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('modosSociaisDisponiveis', () => {
  const resposta = (corpo: unknown) => ({ ok: true, json: async () => corpo }) as Response;

  it('lista so os provedores ligados no Supabase', async () => {
    const fetchImpl = vi.fn(async (url: string) => resposta({ external: { google: true, azure: false } }));
    const modos = await modosSociaisDisponiveis('multiplixe-v2.vercel.app', {
      url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(modos).toEqual({ google: 'supabase' });
  });

  it('inclui Microsoft (azure) quando o Entra ID esta habilitado', async () => {
    const fetchImpl = vi.fn(async () => resposta({ external: { google: false, azure: true } }));
    const modos = await modosSociaisDisponiveis('multiplixe-v2.vercel.app', {
      url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(modos).toEqual({ azure: 'supabase' });
  });

  it('sem provedor ligado nao mostra botao nenhum', async () => {
    const fetchImpl = vi.fn(async () => resposta({ external: {} }));
    const modos = await modosSociaisDisponiveis('multiplixe-v2.vercel.app', {
      url: 'https://projeto.supabase.co', chave: 'k', fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(modos).toEqual({});
  });
});