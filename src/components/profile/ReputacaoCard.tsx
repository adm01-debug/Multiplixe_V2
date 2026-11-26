import { MessagesSquare, ThumbsDown, ThumbsUp, Star, ShieldCheck, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { nivelDaReputacao, PESOS_REPUTACAO } from '@/lib/reputacao';
import { useReputacao, type DetalheReputacao } from '@/hooks/useReputacao';
import { useT } from '@/lib/i18n';

interface ReputacaoCardProps {
  detalhe: DetalheReputacao | null;
  carregando?: boolean;
  erro?: string | null;
  recarregar?: () => void;
}

export const ReputacaoCard = ({ detalhe, carregando, erro, recarregar }: ReputacaoCardProps) => {
  const { t, locale } = useT();
  const total = detalhe?.total ?? 0;
  const nivel = nivelDaReputacao(total);
  const pontos = (numero: number) =>
    `${numero.toLocaleString(locale)} ${numero === 1 ? t('reputation.point') : t('reputation.points')}`;

  return (
    <section className="mb-12" aria-labelledby="titulo-reputacao">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <ShieldCheck className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h3 id="titulo-reputacao" className="text-2xl font-display font-bold text-foreground">{t('reputation.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('reputation.subtitle')}</p>
        </div>
      </div>

      {erro ? (
        <div className="rounded-2xl bg-card/80 border border-border/50 neon-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t('reputation.error')}</p>
          {recarregar ? (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={recarregar}>
              <RefreshCw className="h-4 w-4 mr-2" /> {t('reputation.retry')}
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
                <span className="text-4xl font-display font-bold text-foreground">{total.toLocaleString(locale)}</span>
                <span className="text-sm text-muted-foreground">{total === 1 ? t('reputation.point') : t('reputation.points')}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-violet-500">
                <Star className="h-4 w-4" /> {t('reputation.level')} {nivel.nivel} - {t(nivel.chave)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {nivel.proximo_minimo === null
                ? t('reputation.max')
                : `${t('reputation.missing')} ${pontos(nivel.faltam)} ${t('reputation.toNext')}`}
            </p>
          </div>

          <Progress value={nivel.progresso} className="h-2 mb-6" aria-label={t('reputation.progress')} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <ThumbsUp className="h-5 w-5 text-emerald-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.votos_recebidos ?? 0}</div>
              <p className="text-xs text-muted-foreground">{t('reputation.votesUp')}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <MessagesSquare className="h-5 w-5 text-blue-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.respostas ?? 0}</div>
              <p className="text-xs text-muted-foreground">{t('reputation.answers')}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <Star className="h-5 w-5 text-amber-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.respostas_aceitas ?? 0}</div>
              <p className="text-xs text-muted-foreground">{t('reputation.accepted')}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <ThumbsDown className="h-5 w-5 text-rose-500 mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{detalhe?.votos_negativos ?? 0}</div>
              <p className="text-xs text-muted-foreground">{t('reputation.votesDown')}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">{t('reputation.howTo')}</p>
            <ul className="space-y-1">
              <li>+{PESOS_REPUTACAO.voto_recebido} {t('reputation.howVote')}</li>
              <li>+{PESOS_REPUTACAO.resposta} {t('reputation.howAnswer')}</li>
              <li>+{PESOS_REPUTACAO.resposta_aceita} {t('reputation.howAccepted')}</li>
            </ul>
          </div>
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
