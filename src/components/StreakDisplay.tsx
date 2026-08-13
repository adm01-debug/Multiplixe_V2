import { Flame, Zap, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  isAtRisk?: boolean;
  hasStudiedToday?: boolean;
  compact?: boolean;
}

const StreakDisplay = ({ 
  currentStreak, 
  longestStreak, 
  isAtRisk = false, 
  hasStudiedToday = false,
  compact = false 
}: StreakDisplayProps) => {
  // Generate last 7 days for the streak calendar
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase(),
      isActive: i >= 7 - currentStreak,
      isToday: i === 6,
    };
  });

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
        isAtRisk 
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 animate-pulse' 
          : hasStudiedToday
            ? 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/20'
            : 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/20'
      }`}>
        <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
        <span className={`text-sm font-bold ${currentStreak > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
          {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
        </span>
        {isAtRisk && (
          <span className="text-xs text-amber-500 animate-pulse">⚠️</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative p-6 rounded-2xl bg-card/80 border border-border/50 neon-card overflow-hidden">
      {/* Background glow for active streak */}
      {currentStreak > 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5" />
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              currentStreak > 0 
                ? 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25' 
                : 'bg-muted'
            }`}>
              <Flame className={`h-6 w-6 ${currentStreak > 0 ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">Sequência de Estudos</h3>
              <p className="text-sm text-muted-foreground">Estude todos os dias para manter</p>
            </div>
          </div>

          {/* Current streak badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            currentStreak > 0
              ? 'bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20'
              : 'bg-muted/50'
          }`}>
            <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
            <span className={`text-xl font-display font-bold ${currentStreak > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
              {currentStreak}
            </span>
          </div>
        </div>

        {/* Streak warning */}
        {isAtRisk && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 animate-pulse">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-500">Sua sequência está em risco!</p>
              <p className="text-xs text-muted-foreground">Complete uma aula hoje para manter sua sequência de {currentStreak} dias</p>
            </div>
          </div>
        )}

        {/* Today's status */}
        {hasStudiedToday && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-500">Você estudou hoje!</p>
              <p className="text-xs text-muted-foreground">Continue assim para aumentar sua sequência</p>
            </div>
          </div>
        )}

        {/* Week calendar */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {days.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                day.isActive 
                  ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg' 
                  : day.isToday
                    ? 'bg-muted/50 border-2 border-dashed border-muted-foreground/30'
                    : 'bg-muted/30'
              }`}
            >
              <span className={`text-xs font-medium ${day.isActive ? 'text-white' : 'text-muted-foreground'}`}>
                {day.day}
              </span>
              <div className={`w-6 h-6 mt-1 rounded-full flex items-center justify-center ${
                day.isActive ? 'bg-white/20' : ''
              }`}>
                {day.isActive ? (
                  <Flame className="h-4 w-4 text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Maior sequência</span>
            </div>
            <span className="text-2xl font-display font-bold text-foreground">{longestStreak} dias</span>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">XP bônus/dia</span>
            </div>
            <span className="text-2xl font-display font-bold text-foreground">
              +{Math.min(10 + (currentStreak * 5), 60)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;
