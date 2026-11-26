import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { Trophy, Zap, Star, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  type: 'xp' | 'badge' | 'streak' | 'course';
  title: string;
  description: string;
  value?: number;
  icon?: string;
}

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementCelebration = ({ achievement, onClose }: AchievementCelebrationProps) => {
  const { fireAchievement, fireXP, fireCourseComplete } = useConfetti();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Fire appropriate confetti based on achievement type
      setTimeout(() => {
        switch (achievement.type) {
          case 'xp':
            fireXP();
            break;
          case 'badge':
            fireAchievement();
            break;
          case 'course':
            fireCourseComplete();
            break;
          case 'streak':
            fireAchievement();
            break;
        }
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [achievement, fireAchievement, fireXP, fireCourseComplete]);

  if (!achievement || !isVisible) return null;

  const getIcon = () => {
    switch (achievement.type) {
      case 'xp':
        return <Zap className="h-8 w-8 text-white" />;
      case 'badge':
        return <Star className="h-8 w-8 text-white" />;
      case 'course':
        return <Trophy className="h-8 w-8 text-white" />;
      case 'streak':
        return <Sparkles className="h-8 w-8 text-white" />;
      default:
        return <Star className="h-8 w-8 text-white" />;
    }
  };

  const getGradient = () => {
    switch (achievement.type) {
      case 'xp':
        return 'from-emerald-500 to-teal-500';
      case 'badge':
        return 'from-amber-500 to-orange-500';
      case 'course':
        return 'from-primary to-accent';
      case 'streak':
        return 'from-rose-500 to-pink-500';
      default:
        return 'from-primary to-accent';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon" aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <div className="text-center">
          {/* Icon with glow */}
          <div className="relative inline-flex mb-6">
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradient()} rounded-full blur-xl opacity-50 animate-pulse`} />
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center shadow-lg`}>
              {getIcon()}
            </div>
            
            {/* Sparkles around icon */}
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-warning animate-bounce" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* Badge for XP amount */}
          {achievement.type === 'xp' && achievement.value && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4">
              <Zap className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-display font-bold text-emerald-500">+{achievement.value} XP</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            {achievement.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {achievement.description}
          </p>

          {/* Action button */}
          <Button
            onClick={onClose}
            className={`w-full h-12 rounded-xl bg-gradient-to-r ${getGradient()} text-white font-semibold hover:opacity-90 transition-opacity`}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AchievementCelebration;
