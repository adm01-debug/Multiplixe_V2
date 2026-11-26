import { motion } from 'framer-motion';
import { Clock, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n';
import { useSeasonalEvent } from '@/hooks/useSeasonalEvent';

interface Props {
  className?: string;
}

const SeasonalEventBanner = ({ className = '' }: Props) => {
  const { t } = useT();
  const { evento, carregando, erro, recarregar } = useSeasonalEvent();

  if (carregando) {
    return <Skeleton className={`h-24 w-full rounded-2xl ${className}`} />;
  }

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">{t('events.error')}</p>
          <Button variant="outline" size="sm" onClick={() => recarregar()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('events.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!evento) return null;

  const prazo =
    evento.days_left > 1
      ? `${evento.days_left} ${t('events.days')}`
      : evento.days_left === 1
        ? `1 ${t('events.day')}`
        : t('events.today');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={`overflow-hidden border-primary/40 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 ${className}`}
      >
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-primary/30 bg-background/60 p-2.5">
              {evento.emoji ? (
                <span className="block text-xl leading-none" aria-hidden="true">
                  {evento.emoji}
                </span>
              ) : (
                <Sparkles className="h-6 w-6 text-primary neon-icon" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{evento.title}</h2>
                <Badge className="gap-1">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  {t('events.xpBonus')} {evento.xp_multiplier}x
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{evento.description ?? t('events.subtitle')}</p>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground sm:shrink-0">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t('events.deadline')} {prazo}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SeasonalEventBanner;