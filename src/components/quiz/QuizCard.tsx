import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileQuestion, Trophy, Star, Clock, CheckCircle } from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { useQuizzes } from '@/hooks/useQuizzes';

interface Quiz {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  quiz_questions: Array<{
    id: string;
    question_text: string;
    explanation: string | null;
    order_index: number;
    quiz_options: Array<{
      id: string;
      option_text: string;
      is_correct: boolean;
      order_index: number;
    }>;
  }>;
}

interface QuizCardProps {
  lessonId?: string;
  courseId?: string;
  onComplete?: () => void;
}

export const QuizCard = ({ lessonId, courseId, onComplete }: QuizCardProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const { fetchQuizForLesson, fetchQuizForCourse, fetchUserAttempts, submitQuizAttempt, loading } = useQuizzes();

  useEffect(() => {
    const loadQuiz = async () => {
      let fetchedQuiz: Quiz | null = null;
      
      if (lessonId) {
        fetchedQuiz = await fetchQuizForLesson(lessonId);
      } else if (courseId) {
        fetchedQuiz = await fetchQuizForCourse(courseId);
      }

      if (fetchedQuiz) {
        setQuiz(fetchedQuiz);
        
        // Check previous attempts
        const attempts = await fetchUserAttempts(fetchedQuiz.id);
        if (attempts.length > 0) {
          const passed = attempts.some(a => a.passed);
          setHasPassed(passed);
          const maxScore = Math.max(...attempts.map(a => a.score));
          setBestScore(maxScore);
        }
      }
    };

    loadQuiz();
  }, [lessonId, courseId, fetchQuizForLesson, fetchQuizForCourse, fetchUserAttempts]);

  const handleComplete = async (answers: Record<string, string>) => {
    if (!quiz) return null;
    
    const result = await submitQuizAttempt(quiz, answers);
    
    if (result) {
      if (result.passed && !hasPassed) {
        setHasPassed(true);
      }
      if (bestScore === null || result.score > bestScore) {
        setBestScore(result.score);
      }
    }
    
    return result;
  };

  const handleClose = () => {
    setIsOpen(false);
    if (hasPassed && onComplete) {
      onComplete();
    }
  };

  if (!quiz) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileQuestion className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                {quiz.description && (
                  <CardDescription>{quiz.description}</CardDescription>
                )}
              </div>
            </div>
            {hasPassed && (
              <Badge className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge variant="outline" className="gap-1">
              <FileQuestion className="w-3 h-3" />
              {quiz.quiz_questions.length} questões
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Trophy className="w-3 h-3" />
              {quiz.passing_score}% para passar
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Star className="w-3 h-3" />
              +{quiz.xp_reward} XP
            </Badge>
            {quiz.time_limit_seconds && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(quiz.time_limit_seconds)}
              </Badge>
            )}
          </div>

          {bestScore !== null && (
            <p className="text-sm text-muted-foreground mb-4">
              Melhor pontuação: <span className="font-semibold">{bestScore}%</span>
            </p>
          )}

          <Button onClick={() => setIsOpen(true)} className="w-full">
            {hasPassed ? 'Refazer quiz' : 'Iniciar quiz'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="p-6">
            <QuizPlayer
              quiz={quiz}
              onComplete={handleComplete}
              onClose={handleClose}
              loading={loading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
