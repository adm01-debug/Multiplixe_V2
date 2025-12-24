import { Progress } from "@/components/ui/progress";
import { calculateUserLevel, UserLevel } from "@/lib/levelSystem";
import { Sparkles, ChevronRight } from "lucide-react";

interface LevelProgressProps {
  totalXP: number;
  compact?: boolean;
}

const LevelProgress = ({ totalXP, compact = false }: LevelProgressProps) => {
  const userLevel: UserLevel = calculateUserLevel(totalXP);
  const { currentLevel, nextLevel, xpInCurrentLevel, xpNeededForNextLevel, progressPercentage } = userLevel;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${currentLevel.gradient} shadow-lg neon-button`}>
          <span className="text-lg">{currentLevel.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">Nível {currentLevel.level}</span>
            <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentLevel.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden neon-card p-6">
      {/* Background effects */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentLevel.gradient} opacity-5 dark:opacity-15`} />
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${currentLevel.gradient} shadow-xl neon-button`}>
              <span className="text-3xl">{currentLevel.icon}</span>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center pulse-glow">
                <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-bold text-foreground">Nível {currentLevel.level}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${currentLevel.gradient} text-white`}>
                  {currentLevel.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {nextLevel 
                  ? `Próximo: ${nextLevel.name} (Nível ${nextLevel.level})`
                  : "Nível máximo atingido! 🎉"
                }
              </p>
            </div>
          </div>
          
          {nextLevel && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/50 neon-border">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${nextLevel.gradient} opacity-50`}>
                <span className="text-lg">{nextLevel.icon}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Próximo nível</p>
                <p className="text-sm font-bold text-foreground">{nextLevel.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="font-bold text-primary neon-text">
              {xpInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden neon-border">
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentLevel.gradient} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            
            {/* Percentage indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `calc(${Math.min(progressPercentage, 92)}% + 4px)` }}
            >
              {progressPercentage > 10 && (
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {Math.round(progressPercentage)}%
                </span>
              )}
            </div>
          </div>

          {/* XP needed info */}
          {nextLevel && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4 neon-icon" />
              <span>
                Faltam <span className="font-bold text-primary">{(xpNeededForNextLevel - xpInCurrentLevel).toLocaleString()} XP</span> para o próximo nível
              </span>
            </div>
          )}
        </div>

        {/* Level milestones (mini preview) */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
              const isUnlocked = currentLevel.level >= lvl;
              const isCurrent = currentLevel.level === lvl;
              return (
                <div 
                  key={lvl}
                  className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                    isCurrent 
                      ? `bg-gradient-to-br ${currentLevel.gradient} shadow-lg scale-110` 
                      : isUnlocked 
                        ? 'bg-primary/20 dark:bg-primary/30' 
                        : 'bg-muted/50'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    isCurrent 
                      ? 'text-white' 
                      : isUnlocked 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                  }`}>
                    {lvl}
                  </span>
                  {isCurrent && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
