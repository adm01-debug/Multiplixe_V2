import { Button } from '@/components/ui/button';
import { Play, Zap, Loader2, Clock, BookOpen, Award, User, CheckCircle, Target, FileQuestion, TrendingUp } from 'lucide-react';

interface Props {
  progress: { progress_percentage: number } | null;
  completedLessons: number;
  totalLessons: number;
  durationText: string;
  instructorName: string | null;
  hasQuiz: boolean;
  quizPassed: { passed: boolean; score: number } | null;
  starting: boolean;
  onContinue: () => void;
  onStart: () => void;
  onOpenQuiz: () => void;
}

const CourseDetailSidebar = ({ progress, completedLessons, totalLessons, durationText, instructorName, hasQuiz, quizPassed, starting, onContinue, onStart, onOpenQuiz }: Props) => (
  <div className="sticky top-24 rounded-[2rem] bg-card border border-border/50 overflow-hidden neon-card">
    <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
    <div className="p-6 space-y-6">
      {progress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Seu progresso</span>
            <span className="text-lg font-bold text-primary neon-text">{progress.progress_percentage}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent progress-animated transition-all duration-500 dark:shadow-[0_0_10px_hsl(270_100%_70%/0.5)]" style={{ width: `${progress.progress_percentage}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{completedLessons} de {totalLessons} aulas concluídas</p>
        </div>
      )}

      {progress && progress.progress_percentage >= 100 && hasQuiz && (
        <div className="space-y-3">
          {quizPassed && (
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${quizPassed.passed ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20' : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'}`}>
              <div className={`p-2 rounded-xl ${quizPassed.passed ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'}`}>
                {quizPassed.passed ? <CheckCircle className="h-5 w-5 text-white" /> : <Target className="h-5 w-5 text-white" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${quizPassed.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {quizPassed.passed ? 'Quiz Aprovado!' : 'Tente novamente'}
                </p>
                <p className="text-xs text-muted-foreground">{quizPassed.passed ? 'Sua pontuação' : 'Melhor pontuação'}: <span className="font-bold">{quizPassed.score}%</span></p>
              </div>
              {quizPassed.passed && <Award className="h-6 w-6 text-emerald-500" />}
            </div>
          )}
          <Button className={`w-full h-12 rounded-2xl text-base font-semibold gap-2 shadow-lg transition-all ${quizPassed?.passed ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25'}`} onClick={onOpenQuiz}>
            <FileQuestion className="h-5 w-5" />{quizPassed?.passed ? 'Refazer Quiz' : 'Fazer Quiz Final'}
          </Button>
        </div>
      )}

      {progress ? (
        <Button className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all neon-button" onClick={onContinue}>
          <Play className="h-5 w-5" />Continuar Curso
        </Button>
      ) : (
        <Button className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all neon-button" onClick={onStart} disabled={starting || totalLessons === 0}>
          {starting ? (<><Loader2 className="h-5 w-5 animate-spin" />Iniciando...</>) : (<><Zap className="h-5 w-5" />Começar Agora</>)}
        </Button>
      )}

      <div className="space-y-4 pt-4 border-t border-border/50">
        {[
          { icon: Clock, label: durationText, sublabel: "Duração total", gradient: "from-blue-500 to-cyan-500" },
          { icon: BookOpen, label: `${totalLessons} aulas`, sublabel: "Conteúdo do curso", gradient: "from-primary to-accent" },
          { icon: Award, label: "Certificado", sublabel: "Ao concluir o curso", gradient: "from-amber-500 to-orange-500" },
        ].map((stat, index) => (
          <div key={index} className="flex items-center gap-3 group">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}/10 group-hover:${stat.gradient}/20 transition-colors`}>
              <stat.icon className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {instructorName && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Instrutor(a)</p>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{instructorName}</p>
              <p className="text-xs text-muted-foreground">Instrutor MULTIPLIXE</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default CourseDetailSidebar;
