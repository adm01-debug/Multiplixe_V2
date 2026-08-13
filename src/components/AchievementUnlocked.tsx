import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { X, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  xp_reward: number;
}

interface AchievementUnlockedProps {
  achievement: NewAchievement | null;
  onClose: () => void;
}

const AchievementUnlocked = ({ achievement, onClose }: AchievementUnlockedProps) => {
  const { fireAchievement } = useConfetti();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setTimeout(() => {
        fireAchievement();
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [achievement, fireAchievement]);

  if (!achievement || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in dark:shadow-primary/20">
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
          {/* Badge indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 animate-bounce">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">CONQUISTA DESBLOQUEADA!</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>

          {/* Icon with glow */}
          <div className="relative inline-flex mb-6">
            <div className={`absolute inset-0 bg-gradient-to-r ${achievement.gradient} rounded-full blur-xl opacity-50 animate-pulse`} />
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${achievement.gradient} flex items-center justify-center shadow-lg`}>
              <span className="text-4xl">{achievement.icon}</span>
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-warning animate-bounce" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* XP Reward */}
          {achievement.xp_reward > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4">
              <Zap className="h-5 w-5 text-emerald-500" />
              <span className="text-xl font-display font-bold text-emerald-500">+{achievement.xp_reward} XP</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            {achievement.name}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {achievement.description}
          </p>

          {/* Action button */}
          <Button
            onClick={onClose}
            className={`w-full h-12 rounded-xl bg-gradient-to-r ${achievement.gradient} text-white font-semibold hover:opacity-90 transition-opacity`}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AchievementUnlocked;
