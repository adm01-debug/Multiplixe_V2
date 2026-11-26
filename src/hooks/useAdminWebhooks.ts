import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const EVENTOS_WEBHOOK = [
  'curso.concluido',
  'certificado.emitido',
  'conquista.desbloqueada',
  'ranking.semanal',
  'teste',
] as const;

export type EventoWebhook = (typeof EVENTOS_WEBHOOK)[number];

export const ROTULO_EVENTO: Record<EventoWebhook, string> = {
  'curso.concluido': 'Curso concluído',
  'certificado.emitido': 'Certificado emitido',
  'conquista.desbloqueada': 'Conquista desbloqueada',
  'ranking.semanal': 'Ranking semanal',
  teste: 'Teste manual',
};

export const FORMATOS_WEBHOOK = [
  {
    valor: 'generico',
    rotulo: 'JSON da plataforma',
    descricao: 'Corpo do Multiplixe (id, evento, ocorrido_em, dados) assinado em HMAC-SHA256.',
  },
  {
    valor: 'slack',
    rotulo: 'Slack (Incoming Webhook)',
    descricao: 'Mensagem de texto e blocos aceita pelo Slack. Cole a URL do Incoming Webhook do canal.',
  },
] as const;

export type FormatoWebhook = (typeof FORMATOS_WEBHOOK)[number]['valor'];

export const descricaoFormato = (formato: string) =>
  FORMATOS_WEBHOOK.find((item) => item.valor === formato)?.descricao ??
  FORMATOS_WEBHOOK[0].descricao;

export const rotuloFormato = (formato: string) =>
  FORMATOS_WEBHOOK.find((item) => item.valor === formato)?.rotulo ?? FORMATOS_WEBHOOK[0].rotulo;

export type StatusEntrega = 'pendente' | 'entregue' | 'falhou';

export interface EndpointWebhook {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  secret: string;
  formato: FormatoWebhook;
  is_active: boolean;
  descricao: string | null;
  created_at: string;
}

export interface EndpointInput {
  nome: string;
  url: string;
  eventos: string[];
  formato: FormatoWebhook;
  descricao: string | null;
  is_active: boolean;
}

export interface EntregaWebhook {
  id: string;
  endpoint_id: string;
  evento: string;
  status: StatusEntrega;
  tentativas: number;
  resposta_status: number | null;
  erro: string | null;
  created_at: string;
  entregue_em: string | null;
}

export const CHAVE_ADMIN_WEBHOOKS = ['admin-webhooks'];
export const CHAVE_ENTREGAS_WEBHOOK = ['admin-webhook-entregas'];

const STATUS_VALIDOS: StatusEntrega[] = ['pendente', 'entregue', 'falhou'];

const normalizarEndpoint = (bruto: Record<string, unknown>): EndpointWebhook => ({
  id: String(bruto.id ?? ''),
  nome: typeof bruto.nome === 'string' ? bruto.nome : '',
  url: typeof bruto.url === 'string' ? bruto.url : '',
  eventos: Array.isArray(bruto.eventos) ? bruto.eventos.map(String) : [],
  secret: typeof bruto.secret === 'string' ? bruto.secret : '',
  formato: bruto.formato === 'slack' ? 'slack' : 'generico',
  is_active: bruto.is_active !== false,
  descricao: typeof bruto.descricao === 'string' ? bruto.descricao : null,
  created_at: typeof bruto.created_at === 'string' ? bruto.created_at : '',
});

const normalizarEntrega = (bruto: Record<string, unknown>): EntregaWebhook => {
  const status = String(bruto.status ?? 'pendente') as StatusEntrega;

  return {
    id: String(bruto.id ?? ''),
    endpoint_id: String(bruto.endpoint_id ?? ''),
    evento: typeof bruto.evento === 'string' ? bruto.evento : '',
    status: STATUS_VALIDOS.includes(status) ? status : 'pendente',
    tentativas: Number(bruto.tentativas ?? 0),
    resposta_status:
      typeof bruto.resposta_status === 'number' ? bruto.resposta_status : null,
    erro: typeof bruto.erro === 'string' ? bruto.erro : null,
    created_at: typeof bruto.created_at === 'string' ? bruto.created_at : '',
    entregue_em: typeof bruto.entregue_em === 'string' ? bruto.entregue_em : null,
  };
};

export const validarEndpoint = (dados: EndpointInput): string | null => {
  if (!dados.nome.trim()) return 'Informe um nome para identificar o destino.';
  if (!/^https:\/\/[^\s]+$/i.test(dados.url.trim())) {
    return 'A URL precisa começar com https:// e não pode ter espaços.';
  }
  if (!dados.eventos.length) return 'Selecione pelo menos um evento.';
  const invalido = dados.eventos.find((evento) => !EVENTOS_WEBHOOK.includes(evento as EventoWebhook));
  if (invalido) return `Evento não suportado: ${invalido}.`;
  if (!FORMATOS_WEBHOOK.some((formato) => formato.valor === dados.formato)) {
    return 'Formato de mensagem não suportado.';
  }

  return null;
};

export const contagensEntregas = (entregas: EntregaWebhook[]) => {
  const contagem = { entregues: 0, pendentes: 0, falhas: 0 };

  for (const entrega of entregas) {
    if (entrega.status === 'entregue') contagem.entregues += 1;
    else if (entrega.status === 'pendente') contagem.pendentes += 1;
    else contagem.falhas += 1;
  }

  return contagem;
};

export const mascararSecret = (secret: string) =>
  secret ? `${secret.slice(0, 6)}${'•'.repeat(12)}${secret.slice(-4)}` : '';

export const rotuloEvento = (evento: string) =>
  ROTULO_EVENTO[evento as EventoWebhook] ?? evento;

const invalidar = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: CHAVE_ADMIN_WEBHOOKS });
  queryClient.invalidateQueries({ queryKey: CHAVE_ENTREGAS_WEBHOOK });
};

export const useAdminWebhooks = () => {
  const endpoints = useQuery({
    queryKey: CHAVE_ADMIN_WEBHOOKS,
    staleTime: 0,
    queryFn: async (): Promise<EndpointWebhook[]> => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('id, nome, url, eventos, secret, formato, is_active, descricao, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((linha) => normalizarEndpoint(linha as Record<string, unknown>));
    },
  });

  const entregas = useQuery({
    queryKey: CHAVE_ENTREGAS_WEBHOOK,
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async (): Promise<EntregaWebhook[]> => {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id, endpoint_id, evento, status, tentativas, resposta_status, erro, created_at, entregue_em')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      return (data ?? []).map((linha) => normalizarEntrega(linha as Record<string, unknown>));
    },
  });

  return {
    endpoints: endpoints.data ?? [],
    entregas: entregas.data ?? [],
    carregando: endpoints.isPending,
    erro: endpoints.error ? (endpoints.error as Error).message : null,
    recarregar: () => {
      void endpoints.refetch();
      void entregas.refetch();
    },
  };
};

export const useSalvarEndpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dados }: EndpointInput & { id?: string }) => {
      const payload = {
        nome: dados.nome.trim(),
        url: dados.url.trim(),
        eventos: dados.eventos,
        formato: dados.formato,
        descricao: dados.descricao?.trim() ? dados.descricao.trim() : null,
        is_active: dados.is_active,
      };

      if (id) {
        const { error } = await supabase.from('webhook_endpoints').update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      toast.success('Endpoint de webhook salvo.');
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível salvar o endpoint: ${(erro as Error).message}`),
  });
};

export const useAlternarEndpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ is_active: ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(queryClient),
    onError: (erro) => toast.error(`Não foi possível alterar o endpoint: ${(erro as Error).message}`),
  });
};

export const useExcluirEndpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Endpoint removido.');
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível remover o endpoint: ${(erro as Error).message}`),
  });
};

export const useTestarEndpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (endpointId: string) => {
      const { data, error } = await supabase.rpc('enfileirar_webhook', {
        p_evento: 'teste',
        p_payload: { origem: 'admin', enviado_em: new Date().toISOString() },
        p_endpoint_id: endpointId,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: (enfileiradas) => {
      toast.success(
        enfileiradas > 0
          ? 'Evento de teste enfileirado. A entrega aparece no histórico em instantes.'
          : 'Este endpoint não recebe o evento de teste — ative-o e confira os eventos assinados.',
      );
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Falha ao enfileirar teste: ${(erro as Error).message}`),
  });
};

export const useLimparEntregas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('webhook_deliveries').delete().not('id', 'is', null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Histórico limpo.');
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível limpar o histórico: ${(erro as Error).message}`),
  });
};