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
  Loader2,
  Sparkles,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useStreaks } from '@/hooks/useStreaks';

const challengeIcons: Record<string, typeof Target> = {
  watch_lessons: BookOpen,
  complete_quiz: Trophy,
  study_minutes: Clock,
  earn_xp: Zap,
};

// Calculate time until midnight
const getTimeUntilReset = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

const DailyChallenges = () => {
  const { 
    challenges, 
    loading, 
    claiming, 
    claimReward, 
    completedCount, 
    totalCount,
    unclaimedCount 
  } = useDailyChallenges();
  
  const { currentStreak } = useStreaks();
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
  const [showCelebration, setShowCelebration] = useState(false);

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show celebration when all completed
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalCount]);

  // Calculate streak bonus multiplier
  const streakBonus = currentStreak 
    ? Math.min(currentStreak * 5, 50) // Max 50% bonus
    : 0;

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

  const totalXP = challenges.reduce((acc, c) => acc + c.challenge.xp_reward, 0);
  const bonusXP = Math.round(totalXP * (streakBonus / 100));
  const allCompleted = completedCount === totalCount;

  return (
    <div className="rounded-2xl border border-border bg-card/50 overflow-hidden relative">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-50"
                />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">Todos Completos!</p>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold">+{totalXP + bonusXP} XP Total</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
              animate={unclaimedCount > 0 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: unclaimedCount > 0 ? Infinity : 0, repeatDelay: 2 }}
            >
              <Target className="h-5 w-5 text-amber-500" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-foreground">
                  Desafios Diários
                </h3>
                {unclaimedCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full"
                  >
                    {unclaimedCount}
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} completados
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                +{totalXP} XP
              </span>
            </div>
            {streakBonus > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-amber-500 font-medium"
              >
                +{streakBonus}% bônus streak
              </motion.span>
            )}
          </div>
        </div>

        {/* Timer and progress */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span>Reinicia em {timeUntilReset.hours}h {timeUntilReset.minutes}m</span>
          </div>
          <span className="text-xs font-medium text-primary">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>

        {/* Overall progress */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
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
            const xpWithBonus = challenge.challenge.xp_reward + Math.round(challenge.challenge.xp_reward * (streakBonus / 100));

            return (
              <motion.div
                key={challenge.challenge_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
                className={cn(
                  'relative p-4 rounded-xl border transition-all duration-200',
                  isCompleted
                    ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20'
                    : 'bg-muted/30 border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <motion.div 
                    className={cn(
                      'p-2.5 rounded-xl shrink-0 transition-colors relative',
                      isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    {canClaim && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'font-semibold text-sm',
                        isCompleted ? 'text-primary' : 'text-foreground'
                      )}>
                        {challenge.challenge.title}
                      </h4>
                      {canClaim && (
                        <motion.span 
                          className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          COLETAR
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {challenge.challenge.description}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full relative',
                            isCompleted
                              ? 'bg-primary'
                              : 'bg-gradient-to-r from-primary/60 to-primary'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground shrink-0 tabular-nums">
                        {challenge.current_progress}/{challenge.challenge.target_value}
                      </span>
                    </div>
                  </div>

                  {/* Reward / Claim button */}
                  <div className="shrink-0">
                    {canClaim ? (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                              <span>+{xpWithBonus}</span>
                            </>
                          )}
                        </Button>
                      </motion.div>
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

        {/* All completed message */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-amber-500 font-semibold">
              <Trophy className="h-5 w-5" />
              <span>Parabéns! Todos os desafios completados!</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Volte amanhã para novos desafios
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenges;
