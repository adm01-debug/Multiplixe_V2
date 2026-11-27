import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Loader2,
  Trash2,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import { toast } from 'sonner';

type FeedbackTipo = 'bug' | 'idea' | 'question' | 'general';
type FeedbackStatus = 'novo' | 'em_analise' | 'resolvido';

interface FeedbackRow {
  id: string;
  user_id: string;
  tipo: FeedbackTipo;
  humor: 'happy' | 'neutral' | 'sad' | null;
  mensagem: string;
  pagina: string | null;
  status: FeedbackStatus;
  created_at: string;
}

const TIPOS: Record<FeedbackTipo, { label: string; icon: LucideIcon; className: string }> = {
  bug: { label: 'Bug', icon: Bug, className: 'text-rose-500' },
  idea: { label: 'Sugestão', icon: Lightbulb, className: 'text-amber-500' },
  question: { label: 'Dúvida', icon: HelpCircle, className: 'text-blue-500' },
  general: { label: 'Geral', icon: MessageSquare, className: 'text-primary' },
};

const HUMORES: Record<'happy' | 'neutral' | 'sad', { icon: LucideIcon; label: string }> = {
  happy: { icon: Smile, label: 'Satisfeito' },
  neutral: { icon: Meh, label: 'Neutro' },
  sad: { icon: Frown, label: 'Insatisfeito' },
};

const STATUS: Record<FeedbackStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  novo: { label: 'Novo', variant: 'default' },
  em_analise: { label: 'Em análise', variant: 'secondary' },
  resolvido: { label: 'Resolvido', variant: 'outline' },
};

const AdminFeedbackInbox = () => {
  const [filtro, setFiltro] = useState<'todos' | FeedbackStatus>('todos');
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, user_id, tipo, humor, mensagem, pagina, status, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as FeedbackRow[];
    },
  });

  const userIds = useMemo(() => Array.from(new Set(data.map((f) => f.user_id))), [data]);

  const { data: autores = {} } = useQuery({
    queryKey: ['admin', 'feedback-autores', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      if (error) throw error;
      const mapa: Record<string, string> = {};
      for (const p of data || []) {
        mapa[p.user_id] = p.full_name || p.email || 'Aluno sem nome';
      }
      return mapa;
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] });

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feedback excluído');
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visiveis = filtro === 'todos' ? data : data.filter((f) => f.status === filtro);
  const novos = data.filter((f) => f.status === 'novo').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-primary" aria-hidden="true" />
          Feedback dos alunos
          {novos > 0 && <Badge variant="default">{novos} novo{novos > 1 ? 's' : ''}</Badge>}
        </CardTitle>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as 'todos' | FeedbackStatus)}>
          <SelectTrigger className="w-40" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="novo">Novos</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Carregando" />
          </div>
        ) : visiveis.length === 0 ? (
          <SimpleEmptyState
            icon={MessageSquare}
            title="Nenhum feedback"
            description={filtro === 'todos' ? 'Nada enviado pelos alunos ainda.' : 'Nenhum item com esse status.'}
          />
        ) : (
          <ul className="divide-y" aria-label="Feedbacks recebidos">
            {visiveis.map((item) => {
              const tipo = TIPOS[item.tipo];
              const TipoIcon = tipo.icon;
              const HumorIcon = item.humor ? HUMORES[item.humor].icon : null;
              return (
                <li key={item.id} className="py-3 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <TipoIcon className={`h-4 w-4 mt-0.5 shrink-0 ${tipo.className}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap break-words">{item.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {autores[item.user_id] || 'Aluno'}{' '}
                        {item.pagina ? `· ${item.pagina}` : ''} ·{' '}
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {HumorIcon && (
                      <HumorIcon
                        className="h-4 w-4 text-muted-foreground shrink-0"
                        aria-label={HUMORES[item.humor!].label}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <Badge variant={STATUS[item.status].variant}>{STATUS[item.status].label}</Badge>
                    <Select
                      value={item.status}
                      onValueChange={(v) => mudarStatus.mutate({ id: item.id, status: v as FeedbackStatus })}
                    >
                      <SelectTrigger className="w-36 h-8" aria-label={`Status do feedback de ${autores[item.user_id] || 'aluno'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_analise">Em análise</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => excluir.mutate(item.id)}
                      aria-label="Excluir feedback"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackInbox;