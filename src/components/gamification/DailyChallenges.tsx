import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Gift,
  Trophy,
  Flame,
  BookOpen,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { cn } from '@/lib/utils';

const challengeIcons: Record<string, typeof Target> = {
  watch_lessons: BookOpen,
  complete_quiz: Trophy,
  study_minutes: Clock,
  earn_xp: Zap,
};

const DailyChallenges = () => {
  const { 
    challenges, 
    loading, 
    claiming, 
    claimReward, 
    completedCount, 
    totalCount 
  } = useDailyChallenges();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-32 animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Desafios Diários
              </h3>
              <p className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} completados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              +{challenges.reduce((acc, c) => acc + c.challenge.xp_reward, 0)} XP
            </span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Challenges list */}
      <div className="px-6 pb-6 space-y-3">
        <AnimatePresence mode="popLayout">
          {challenges.map((challenge, index) => {
            const Icon = challengeIcons[challenge.challenge.challenge_type] || Target;
            const progress = (challenge.current_progress / challenge.challenge.target_value) * 100;
            const isCompleted = challenge.is_completed;
            const canClaim = isCompleted && !challenge.xp_claimed;
            const isClaiming = claiming === challenge.id;

            return (
              <motion.div
                key={challenge.challenge_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative p-4 rounded-xl border transition-all duration-200',
                  isCompleted
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'p-2.5 rounded-xl shrink-0 transition-colors',
                    isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'font-semibold text-sm',
                        isCompleted ? 'text-primary' : 'text-foreground'
                      )}>
                        {challenge.challenge.title}
                      </h4>
                      {isCompleted && !challenge.xp_claimed && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full animate-pulse">
                          NOVO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {challenge.challenge.description}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            isCompleted
                              ? 'bg-primary'
                              : 'bg-gradient-to-r from-primary/60 to-primary'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        {challenge.current_progress}/{challenge.challenge.target_value}
                      </span>
                    </div>
                  </div>

                  {/* Reward / Claim button */}
                  <div className="shrink-0">
                    {canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => claimReward(challenge.id)}
                        disabled={isClaiming}
                        className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                      >
                        {isClaiming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Gift className="h-4 w-4" />
                            <span>+{challenge.challenge.xp_reward}</span>
                          </>
                        )}
                      </Button>
                    ) : challenge.xp_claimed ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Coletado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                        <Zap className="h-4 w-4" />
                        <span>+{challenge.challenge.xp_reward}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DailyChallenges;
