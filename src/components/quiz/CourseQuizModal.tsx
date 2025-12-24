import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuizPlayer } from './QuizPlayer';
import { useQuizzes } from '@/hooks/useQuizzes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Trophy, Target, Sparkles, Loader2, Award, AlertCircle } from 'lucide-react';

interface CourseQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onQuizPassed?: () => void;
}

export const CourseQuizModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle,
  onQuizPassed 
}: CourseQuizModalProps) => {
  const { user } = useAuth();
  const { fetchQuizForCourse, submitQuizAttempt, loading } = useQuizzes();
  const [quiz, setQuiz] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasPassedQuiz, setHasPassedQuiz] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!isOpen || !courseId || !user) return;
      
      setLoadingQuiz(true);
      
      // Fetch course quiz
      const quizData = await fetchQuizForCourse(courseId);
      setQuiz(quizData);
      
      // Check if user already passed the quiz
      if (quizData) {
        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('score, total_questions, passed')
          .eq('user_id', user.id)
          .eq('quiz_id', quizData.id)
          .order('score', { ascending: false });
        
        if (attempts && attempts.length > 0) {
          const best = Math.round((attempts[0].score / attempts[0].total_questions) * 100);
          setBestScore(best);
          setHasPassedQuiz(attempts.some(a => a.passed));
        }
      }
      
      setLoadingQuiz(false);
    };

    loadQuiz();
  }, [isOpen, courseId, user]);

  const handleQuizComplete = async (answers: Record<string, string>) => {
    if (!quiz) return null;
    
    const result = await submitQuizAttempt(quiz, answers);
    
    if (result?.passed) {
      setHasPassedQuiz(true);
      onQuizPassed();
    }
    
    return result;
  };

  const handleClose = () => {
    setShowQuiz(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loadingQuiz ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando quiz final...</p>
          </div>
        ) : !quiz ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-green-500" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl mb-2">🎉 Parabéns!</DialogTitle>
              <DialogDescription className="text-base">
                Você completou todas as aulas do curso <strong>{courseTitle}</strong>!
                <br />
                Este curso não possui um quiz final obrigatório.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="mt-6 btn-gradient">
              <Award className="w-4 h-4 mr-2" />
              Ver Certificado
            </Button>
          </div>
        ) : showQuiz ? (
          <QuizPlayer
            quiz={quiz}
            onComplete={handleQuizComplete}
            onClose={() => {
              setShowQuiz(false);
              if (hasPassedQuiz) {
                handleClose();
              }
            }}
            loading={loading}
          />
        ) : (
          <div className="py-4">
            <DialogHeader className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                {hasPassedQuiz ? '🏆 Quiz Final Concluído!' : '📝 Quiz Final do Curso'}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {hasPassedQuiz 
                  ? `Você já passou no quiz com ${bestScore}% de aproveitamento!`
                  : `Complete o quiz final de "${courseTitle}" para receber seu certificado.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                <Target className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Aprovação mínima</p>
                  <p className="text-muted-foreground text-sm">Você precisa acertar pelo menos 70% das questões</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Bônus de XP</p>
                  <p className="text-muted-foreground text-sm">Ganhe {quiz.xp_reward} XP ao passar no quiz!</p>
                </div>
              </div>

              {quiz.time_limit_seconds && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Tempo limite</p>
                    <p className="text-muted-foreground text-sm">
                      Você terá {Math.floor(quiz.time_limit_seconds / 60)} minutos para completar
                    </p>
                  </div>
                </div>
              )}

              {bestScore !== null && !hasPassedQuiz && (
                <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-orange-600">Melhor pontuação: {bestScore}%</p>
                    <p className="text-muted-foreground text-sm">Continue tentando para alcançar 70%!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {hasPassedQuiz ? 'Fechar' : 'Fazer depois'}
              </Button>
              {hasPassedQuiz ? (
                <Button onClick={handleClose} className="flex-1 btn-gradient">
                  <Award className="w-4 h-4 mr-2" />
                  Ver Certificado
                </Button>
              ) : (
                <Button onClick={() => setShowQuiz(true)} className="flex-1 btn-gradient">
                  <Target className="w-4 h-4 mr-2" />
                  Iniciar Quiz
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
