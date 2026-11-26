import { motion } from 'framer-motion';
import { Users, Target, Clock, CheckCircle2, Gift, RefreshCw, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n';
import {
  metricaLabel,
  useDepartmentChallenges,
  type MissaoDepartamento,
} from '@/hooks/useDepartmentChallenges';

interface Props {
  className?: string;
  limit?: number;
}

const diasRestantes = (fim: string) => {
  const restante = new Date(fim).getTime() - Date.now();
  if (!Number.isFinite(restante) || restante <= 0) return 0;
  return Math.ceil(restante / 86400000);
};

const DepartmentChallenges = ({ className = '', limit }: Props) => {
  const { t } = useT();
  const { missoes, carregando, erro, recarregar, resgatar, resgatandoId } = useDepartmentChallenges();

  if (carregando) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('missions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t('missions.error')}</p>
          <Button variant="outline" size="sm" onClick={() => recarregar()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('missions.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (missoes.length === 0) return null;

  const lista = limit ? missoes.slice(0, limit) : missoes;
  const concluidas = lista.filter((missao) => missao.concluido).length;

  const renderMissao = (missao: MissaoDepartamento) => {
    const percentual = missao.meta > 0 ? Math.min(100, Math.round((missao.progresso / missao.meta) * 100)) : 0;
    const restante = diasRestantes(missao.fim);
    const resgatando = resgatandoId === missao.id;
    const podeResgatar = missao.concluido && !missao.resgatado && restante > 0;

    return (
      <div
        key={missao.id}
        className="rounded-xl border border-border/50 bg-muted/30 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{missao.titulo}</h3>
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" aria-hidden="true" />
                {missao.departamento ?? t('missions.allDepartments')}
              </Badge>
              {missao.concluido && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {t('missions.completed')}
                </Badge>
              )}
            </div>
            {missao.descricao && (
              <p className="mt-1 text-sm text-muted-foreground">{missao.descricao}</p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3 w-3" aria-hidden="true" />
              {t(metricaLabel(missao.metrica))}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="flex items-center justify-end gap-1 font-bold">
              <Gift className="h-4 w-4 text-primary" aria-hidden="true" />
              {missao.xp} XP
            </p>
            <p className="text-xs text-muted-foreground">{t('missions.reward')}</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress
            value={percentual}
            aria-label={`${t('missions.progress')}: ${percentual}%`}
            className="h-2"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span aria-live="polite">
              {t('missions.goal')}: {missao.progresso} / {missao.meta}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {missao.participantes} {t('missions.participants')} · {missao.membros} {t('missions.members')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {restante > 0
                ? `${t('missions.deadline')} ${restante} ${restante === 1 ? t('missions.day') : t('missions.days')}`
                : t('missions.ended')}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          {missao.resgatado ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {t('missions.claimed')} (+{missao.xpResgatado} XP)
            </Badge>
          ) : (
            <Button
              size="sm"
              disabled={!podeResgatar || resgatando}
              onClick={() => resgatar(missao.id)}
            >
              <Gift className="mr-2 h-4 w-4" aria-hidden="true" />
              {resgatando ? t('missions.claiming') : t('missions.claim')}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('missions.title')}
            <Badge variant="secondary">
              {concluidas}/{lista.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('missions.subtitle')}</p>
        </CardHeader>
        <CardContent className="space-y-3">{lista.map(renderMissao)}</CardContent>
      </Card>
    </motion.div>
  );
};

export default DepartmentChallenges;