import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { Flame, X, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreakCelebrationProps {
  newStreak: number;
  xpAwarded: number;
  isNewRecord: boolean;
  onClose: () => void;
}

const StreakCelebration = ({ newStreak, xpAwarded, isNewRecord, onClose }: StreakCelebrationProps) => {
  const { fireAchievement } = useConfetti();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newStreak > 0) {
      setIsVisible(true);
      setTimeout(() => {
        fireAchievement();
      }, 100);
    }
  }, [newStreak, fireAchievement]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in dark:shadow-rose-500/20">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <div className="text-center">
          {/* Streak indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4 animate-bounce">
            <Flame className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold text-rose-500">
              {isNewRecord ? 'NOVO RECORDE!' : 'SEQUÊNCIA MANTIDA!'}
            </span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>

          {/* Icon with glow */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Flame className="h-12 w-12 text-white" />
            </div>
            
            {/* Record badge */}
            {isNewRecord && (
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Streak count */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 mb-4">
            <span className="text-4xl font-display font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              {newStreak} {newStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          {/* XP Reward */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4">
            <Zap className="h-5 w-5 text-emerald-500" />
            <span className="text-xl font-display font-bold text-emerald-500">+{xpAwarded} XP</span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {isNewRecord 
              ? `Parabéns! Você bateu seu recorde de ${newStreak} dias seguidos estudando!`
              : `Você está em uma sequência de ${newStreak} dias! Continue assim!`
            }
          </p>

          {/* Action button */}
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Estudando
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StreakCelebration;
