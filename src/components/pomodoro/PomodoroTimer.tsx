import { usePomodoro, PomodoroState } from '@/hooks/usePomodoro';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  Timer, 
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const PomodoroTimer = ({ variant = 'full', className }: PomodoroTimerProps) => {
  const {
    state,
    formattedTime,
    progress,
    sessionsCompleted,
    stats,
    startWork,
    pause,
    resume,
    stop
  } = usePomodoro();

  const getStateColor = (state: PomodoroState) => {
    switch (state) {
      case 'work': return 'text-red-500';
      case 'break': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStateLabel = (state: PomodoroState) => {
    switch (state) {
      case 'work': return 'Focando';
      case 'break': return 'Pausa';
      case 'paused': return 'Pausado';
      default: return 'Pronto';
    }
  };

  const getStateIcon = (state: PomodoroState) => {
    switch (state) {
      case 'work': return <Target className="h-5 w-5" />;
      case 'break': return <Coffee className="h-5 w-5" />;
      default: return <Timer className="h-5 w-5" />;
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("text-lg font-mono font-bold", getStateColor(state))}>
          {formattedTime}
        </div>
        {state === 'idle' ? (
          <Button size="sm" variant="ghost" onClick={startWork}>
            <Play className="h-4 w-4" />
          </Button>
        ) : state === 'paused' ? (
          <Button size="sm" variant="ghost" onClick={resume}>
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={pause}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-col gap-3 p-4 rounded-xl bg-card border border-border", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", state === 'work' ? 'bg-red-500/20' : state === 'break' ? 'bg-green-500/20' : 'bg-muted')}>
              {getStateIcon(state)}
            </div>
            <div>
              <p className="text-sm font-medium">{getStateLabel(state)}</p>
              <p className={cn("text-2xl font-mono font-bold", getStateColor(state))}>
                {formattedTime}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {state === 'idle' ? (
              <Button size="sm" onClick={startWork} className="bg-red-500 hover:bg-red-600">
                <Play className="h-4 w-4 mr-1" /> Iniciar
              </Button>
            ) : state === 'paused' ? (
              <>
                <Button size="sm" variant="outline" onClick={stop}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={resume}>
                  <Play className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={stop}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={pause}>
                  <Pause className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("flex flex-col gap-6 p-6 rounded-2xl bg-card border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            state === 'work' ? 'bg-red-500/20 text-red-500' : 
            state === 'break' ? 'bg-green-500/20 text-green-500' : 
            'bg-muted text-muted-foreground'
          )}>
            {getStateIcon(state)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Modo Pomodoro</h3>
            <p className="text-sm text-muted-foreground">{getStateLabel(state)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{stats.totalXpEarned} XP</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "text-7xl font-mono font-bold tracking-tight transition-colors",
          getStateColor(state)
        )}>
          {formattedTime}
        </div>
        <Progress value={progress} className="w-full h-3 rounded-full" />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {state === 'idle' ? (
          <Button size="lg" onClick={startWork} className="bg-red-500 hover:bg-red-600 px-8">
            <Play className="h-5 w-5 mr-2" /> Iniciar Foco
          </Button>
        ) : state === 'paused' ? (
          <>
            <Button size="lg" variant="outline" onClick={stop}>
              <Square className="h-5 w-5 mr-2" /> Parar
            </Button>
            <Button size="lg" onClick={resume} className="px-8">
              <Play className="h-5 w-5 mr-2" /> Continuar
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" variant="outline" onClick={stop}>
              <Square className="h-5 w-5 mr-2" /> Parar
            </Button>
            <Button size="lg" variant="outline" onClick={pause}>
              <Pause className="h-5 w-5 mr-2" /> Pausar
            </Button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{sessionsCompleted}</p>
          <p className="text-xs text-muted-foreground">Esta sessão</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{stats.todaySessions}</p>
          <p className="text-xs text-muted-foreground">Hoje</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
