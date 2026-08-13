import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GraduationCap, LogOut, User, ArrowLeft, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  courseSlug: string;
  courseTitle: string;
  userName: string;
  courseProgress: number;
  onSignOut: () => void;
  focusMode?: boolean;
  onToggleFocus?: () => void;
}

const LessonPlayerHeader = ({ courseSlug, courseTitle, userName, courseProgress, onSignOut, focusMode = false, onToggleFocus }: Props) => (
  <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative p-2 bg-gradient-to-r from-primary to-secondary rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-display font-bold text-foreground hidden sm:block">MULTIPLIXE</span>
          </Link>
          {!focusMode && (
            <>
              <div className="h-6 w-px bg-border/50" />
              <Link to={`/curso/${courseSlug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[200px] truncate">{courseTitle}</span>
                <span className="sm:hidden">Voltar</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!focusMode && (
            <>
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{courseProgress}%</span>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style={{ width: `${courseProgress}%` }} />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{userName}</span>
              </div>
            </>
          )}
          {onToggleFocus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onToggleFocus}
                    aria-pressed={focusMode}
                    aria-label={focusMode ? 'Sair do modo foco' : 'Ativar modo foco'}
                    className="rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                  >
                    {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modo Foco (F)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" size="icon" onClick={onSignOut} className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
);

export default LessonPlayerHeader;
