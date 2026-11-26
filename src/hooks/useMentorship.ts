import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { mensagemErroPedido, type MentorshipStatus } from '@/lib/mentorship';

export interface MentorResumo {
  user_id: string;
  full_name: string;
  department: string | null;
  avatar_url: string | null;
  topics: string[];
  bio: string | null;
  meu_status: MentorshipStatus | null;
}

export interface PedidoMentoria {
  id: string;
  topic: string;
  message: string;
  status: MentorshipStatus;
  response_note: string | null;
  created_at: string;
  responded_at: string | null;
  pessoa_id: string;
  pessoa_nome: string;
  pessoa_area: string | null;
  pessoa_avatar: string | null;
}

export interface MeuPainelMentoria {
  sou_mentor: boolean;
  topics: string[];
  bio: string | null;
  recebidos: PedidoMentoria[];
  enviados: PedidoMentoria[];
}

const CHAVE = 'mentoria';

export const useMentors = (busca: string) => {
  const { user } = useAuth();
  const termo = busca.trim();

  return useQuery({
    queryKey: [CHAVE, 'mentores', termo],
    enabled: !!user,
    queryFn: async (): Promise<MentorResumo[]> => {
      const { data, error } = await supabase.rpc('get_mentors', { p_busca: termo || undefined });
      if (error) throw error;
      return (data ?? []) as unknown as MentorResumo[];
    },
  });
};

export const useMyMentorship = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [CHAVE, 'painel'],
    enabled: !!user,
    queryFn: async (): Promise<MeuPainelMentoria> => {
      const { data, error } = await supabase.rpc('get_my_mentorship');
      if (error) throw error;
      const bruto = (data ?? {}) as unknown as Partial<MeuPainelMentoria>;
      return {
        sou_mentor: bruto.sou_mentor ?? false,
        topics: bruto.topics ?? [],
        bio: bruto.bio ?? null,
        recebidos: bruto.recebidos ?? [],
        enviados: bruto.enviados ?? [],
      };
    },
  });
};

export const useUpdateMentorProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { is_mentor: boolean; topics: string[]; bio: string }) => {
      if (!user) throw new Error('Sessão expirada');
      const { error } = await supabase
        .from('profiles')
        .update({
          is_mentor: input.is_mentor,
          mentor_topics: input.topics,
          mentor_bio: input.bio.trim() ? input.bio.trim() : null,
        })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      toast.success(
        input.is_mentor
          ? 'Pronto! Você apareceu na lista de mentores.'
          : 'Você saiu da lista de mentores.',
      );
    },
    onError: () => toast.error('Não foi possível salvar seu perfil de mentor. Tente novamente.'),
  });
};

export const useRequestMentorship = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { mentorId: string; assunto: string; mensagem: string }) => {
      if (!user) throw new Error('Sessão expirada');
      const { error } = await supabase.from('mentorship_requests').insert({
        mentee_id: user.id,
        mentor_id: input.mentorId,
        topic: input.assunto.trim(),
        message: input.mensagem.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      toast.success('Pedido enviado! O mentor foi avisado.');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(mensagemErroPedido(error?.code, error?.message ?? 'Erro ao enviar o pedido.'));
    },
  });
};

export const useRespondMentorship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; status: MentorshipStatus; nota?: string }) => {
      const { data, error } = await supabase.rpc('respond_mentorship_request', {
        p_id: input.id,
        p_status: input.status,
        p_nota: input.nota?.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      const avisos: Partial<Record<MentorshipStatus, string>> = {
        accepted: 'Mentoria aceita. O aluno foi avisado.',
        declined: 'Pedido recusado. O aluno foi avisado.',
        completed: 'Mentoria marcada como concluída.',
        cancelled: 'Pedido cancelado.',
      };
      toast.success(avisos[input.status] ?? 'Pedido atualizado.');
    },
    onError: (error: { message: string }) =>
      toast.error(error?.message ?? 'Não foi possível atualizar o pedido.'),
  });
};