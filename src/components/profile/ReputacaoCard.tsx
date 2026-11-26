import { MessagesSquare, ThumbsDown, ThumbsUp, Star, ShieldCheck, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { nivelDaReputacao, rotuloPontosReputacao, PESOS_REPUTACAO } from '@/lib/reputacao';
import { useReputacao, type DetalheReputacao } from '@/hooks/useReputacao';

interface ReputacaoCardProps {
  detalhe: DetalheReputacao | null;
  carregando?: boolean;
  erro?: string | null;
  recarregar?: () => void;
}

export const ReputacaoCard = ({ detalhe, carregando, erro, recarregar }: ReputacaoCardProps) => {
  const total = detalhe?.total ?? 0;
  const nivel = nivelDaReputacao(total);

  return (
    <section className="mb-12" aria-labelledby="titulo-reputacao">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <ShieldCheck className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h3 id="titulo-reputacao" className="text-2xl font-display font-bold text-foreground">Reputação</h3>
          <p className="text-sm text-muted-foreground">O quanto você já ajudou outras pessoas a aprender</p>
        </div>
      </div>

      {erro ? (
        <div className="rounded-2xl bg-card/80 border border-border/50 neon-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Não foi possível carregar sua reputação agora.</p>
          {recarregar ? (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={recarregar}>
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar de novo
            </Button>
          ) : null}
        </div>
      ) : carregando ? (
        <div className="rounded-2xl bg-card/80 border border-border/50 neon-card p-6 space-y-4" aria-busy="true">
          <div className="h-8 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card/80 border border-border/50 neon-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-display font-bold text-foreground">{total.toLocaleString('pt-BR')}</span>
                <span className="text-sm text-muted-foreground">{rotuloPontosReputacao(total)}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-violet-500">
                <Star className="h-4 w-4" /> Nível {nivel.nivel} - {nivel.titulo}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {nivel.proximo_minimo === null
                ? 'Você chegou ao nível máximo de reputação.'
                : 'Faltam ' + rotuloPontosReputacao(nivel.faltam) + ' para o próximo nível.'}
            </p>
          </div>

          <Progress value={nivel.progresso} className="h-2 mb-6" aria-label="Progresso para o próximo nível de reputação" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <ThumbsUp className="h-5 w-5 text-emerald-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.votos_recebidos ?? 0}</div>
              <p className="text-xs text-muted-foreground">Votos recebidos</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <MessagesSquare className="h-5 w-5 text-blue-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.respostas ?? 0}</div>
              <p className="text-xs text-muted-foreground">Respostas dadas</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <Star className="h-5 w-5 text-amber-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.respostas_aceitas ?? 0}</div>
              <p className="text-xs text-muted-foreground">Respostas aceitas</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <ThumbsDown className="h-5 w-5 text-rose-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.votos_negativos ?? 0}</div>
              <p className="text-xs text-muted-foreground">Votos contra</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Como ganhar reputação: +{PESOS_REPUTACAO.voto_recebido} por voto recebido, +{PESOS_REPUTACAO.resposta} por resposta em discussão de outra pessoa e +{PESOS_REPUTACAO.resposta_aceita} quando sua resposta é marcada como a melhor.
          </p>
        </div>
      )}
    </section>
  );
};

export const MinhaReputacaoCard = () => {
  const { detalhe, carregando, erro, recarregar } = useReputacao();
  return <ReputacaoCard detalhe={detalhe} carregando={carregando} erro={erro} recarregar={() => { void recarregar(); }} />;
};

export default ReputacaoCard;
