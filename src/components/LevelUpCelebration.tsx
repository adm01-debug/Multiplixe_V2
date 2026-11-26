import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { Trophy, X, Sparkles, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LevelUpData {
  previousLevel: number;
  newLevel: number;
  levelName: string;
  levelIcon: string;
  levelColor: string;
}

interface LevelUpCelebrationProps {
  levelUpData: LevelUpData | null;
  onClose: () => void;
}

const LevelUpCelebration = ({ levelUpData, onClose }: LevelUpCelebrationProps) => {
  const { fireCourseComplete } = useConfetti();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (levelUpData) {
      setIsVisible(true);
      
      // Fire celebratory confetti
      setTimeout(() => {
        fireCourseComplete();
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [levelUpData, fireCourseComplete]);

  if (!levelUpData || !isVisible) return null;

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
          size="icon" aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <div className="text-center">
          {/* Level up indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-bounce">
            <ArrowUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">LEVEL UP!</span>
            <ArrowUp className="h-4 w-4 text-primary" />
          </div>

          {/* Icon with glow */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <span className="text-4xl">{levelUpData.levelIcon}</span>
            </div>
            
            {/* Sparkles around icon */}
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-warning animate-bounce" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            <Trophy className="absolute -bottom-2 -right-3 h-5 w-5 text-amber-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Level badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-4">
            <span className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Nível {levelUpData.newLevel}
            </span>
          </div>

          {/* Level name */}
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            {levelUpData.levelName}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Parabéns! Você evoluiu do nível {levelUpData.previousLevel} para o nível {levelUpData.newLevel}!
          </p>

          {/* Action button */}
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpCelebration;
