import { useState } from 'react';
import { usePomodoro, PomodoroState } from '@/hooks/usePomodoro';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Play, 
  Pause, 
  Square, 
  Timer,
  Target,
  Coffee,
  Zap,
  X,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FloatingPomodoroButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    state,
    formattedTime,
    progress,
    sessionsCompleted,
    stats,
    isFocusMode,
    startWork,
    pause,
    resume,
    stop,
    toggleFocusMode
  } = usePomodoro();

  const getStateColor = (state: PomodoroState) => {
    switch (state) {
      case 'work': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'break': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'paused': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  const getStateIcon = (state: PomodoroState) => {
    switch (state) {
      case 'work': return <Target className="h-5 w-5" />;
      case 'break': return <Coffee className="h-5 w-5" />;
      default: return <Timer className="h-5 w-5" />;
    }
  };

  const getStateLabel = (state: PomodoroState) => {
    switch (state) {
      case 'work': return 'Focando';
      case 'break': return 'Pausa';
      case 'paused': return 'Pausado';
      default: return 'Iniciar Pomodoro';
    }
  };

  return (
    <>
      {/* Focus Mode Overlay */}
      {isFocusMode && state === 'work' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 pointer-events-none" />
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.button
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 rounded-full shadow-lg flex items-center justify-center",
              state !== 'idle' ? "px-4 gap-2" : "w-14 px-0",
              getStateColor(state)
            )}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
            }}
            whileTap={{ 
              scale: 0.95,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            animate={state === 'work' ? {
              boxShadow: [
                "0 0 0 0 rgba(239, 68, 68, 0.4)",
                "0 0 0 12px rgba(239, 68, 68, 0)",
              ],
            } : {}}
            // @ts-ignore - framer-motion types issue
            transition={state === 'work' ? {
              repeat: Infinity,
              duration: 1.5,
            } : {
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
          >
            {getStateIcon(state)}
            {state !== 'idle' && (
              <span className="font-mono font-bold">{formattedTime}</span>
            )}
          </motion.button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              Modo Pomodoro
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 mt-6">
            {/* Timer Display */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getStateIcon(state)}
                <span>{getStateLabel(state)}</span>
              </div>
              
              <div className={cn(
                "text-6xl font-mono font-bold tracking-tight",
                state === 'work' ? 'text-red-500' : 
                state === 'break' ? 'text-green-500' : 
                state === 'paused' ? 'text-yellow-500' : 
                'text-foreground'
              )}>
                {formattedTime}
              </div>

              {state !== 'idle' && (
                <Progress value={progress} className="w-full h-2" />
              )}
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
                    <Square className="h-5 w-5" />
                  </Button>
                  <Button size="lg" onClick={resume} className="px-8">
                    <Play className="h-5 w-5 mr-2" /> Continuar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="outline" onClick={stop}>
                    <Square className="h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={pause}>
                    <Pause className="h-5 w-5 mr-2" /> Pausar
                  </Button>
                </>
              )}
            </div>

            {/* Focus Mode Toggle */}
            {state === 'work' && (
              <Button 
                variant="outline" 
                onClick={toggleFocusMode}
                className="w-full"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                {isFocusMode ? 'Desativar Modo Foco' : 'Ativar Modo Foco'}
              </Button>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionsCompleted}</p>
                <p className="text-xs text-muted-foreground">Esta sessão</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.todaySessions}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* XP Info */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">
                +10 XP por sessão de foco completada
              </span>
            </div>

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>🍅 25 min de foco + 5 min de pausa</p>
              <p className="mt-1">Complete sessões para desbloquear conquistas!</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FloatingPomodoroButton;
