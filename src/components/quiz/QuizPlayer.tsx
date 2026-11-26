import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Trophy, Clock, Star, ArrowRight, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirmExit } from '@/hooks/useConfirmExit';
import QuizReview from './QuizReview';
import { useAnnouncements } from '@/components/accessibility/LiveAnnouncer';
import { buildQuizReview, type QuizReviewData, type QuizReviewPayload } from '@/lib/quizReview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface QuizOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
  order_index: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  quiz_options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  quiz_questions: QuizQuestion[];
}

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (
    answers: Record<string, string>
  ) => Promise<{ score: number; passed: boolean; xpEarned: number; attemptId?: string } | null>;
  onClose: () => void;
  loading?: boolean;
  /** Carrega a revisão (gabarito + explicações) de uma tentativa já gravada. */
  onLoadReview?: (attemptId: string) => Promise<QuizReviewPayload | null>;
}

export const QuizPlayer = ({ quiz, onComplete, onClose, loading, onLoadReview }: QuizPlayerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; xpEarned: number; attemptId?: string } | null>(null);
  const [review, setReview] = useState<QuizReviewData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit_seconds);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz.quiz_questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.quiz_questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.quiz_questions.length - 1;
  const hasAnswered = currentQuestion && answers[currentQuestion.id];
  const hasStartedQuiz = Object.keys(answers).length > 0;

    const exitGuard = useConfirmExit({
      enabled: hasStartedQuiz && !showResult,
      message: 'Você tem um quiz em andamento. Se sair agora, seu progresso será perdido.',
    });

    const { announce, announceProgress } = useAnnouncements();

  // A11Y-006: anuncia a troca de questão e o resultado para leitores de tela.
  useEffect(() => {
    if (showResult) return;
    announceProgress(currentQuestionIndex + 1, quiz.quiz_questions.length, 'Questão');
  }, [currentQuestionIndex, showResult, announceProgress, quiz.quiz_questions.length]);

  useEffect(() => {
    if (!showResult || !result) return;
    announce(
      `${result.passed ? 'Aprovado' : 'Não aprovado'}: ${result.score}% de acertos`,
      result.passed ? 'polite' : 'assertive'
    );
  }, [showResult, result, announce]);

    const requestExit = () => exitGuard.confirmNavigation(onClose);

  // Timer effect - uses ref to avoid stale closure
  const handleSubmitRef = useRef<() => void>(() => {});
  handleSubmitRef.current = async () => {
    const finalAnswers = { ...answers };
    const res = await onComplete(finalAnswers);
    if (res) {
      setResult(res);
      setShowResult(true);
    }
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  // Revisão pós-conclusão: o gabarito vem de get_quiz_review (RPC), nunca da view pública.
  useEffect(() => {
    const attemptId = result?.attemptId;
    if (!showResult || !attemptId || !onLoadReview) return;

    let active = true;
    onLoadReview(attemptId)
      .then((payload) => {
        if (active) setReview(buildQuizReview(payload));
      })
      .catch(() => {
        // Revisão é complementar: em falha, mantém a tela de resultado.
      });

    return () => {
      active = false;
    };
  }, [showResult, result?.attemptId, onLoadReview]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    if (showExplanation) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmitRef.current();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setResult(null);
      setReview(null);
    setTimeLeft(quiz.time_limit_seconds);
    setShowExplanation(false);
  };

    if (showResult && result && review) {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {result.xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg">
              <Star className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">+{result.xpEarned} XP ganhos!</span>
            </div>
          )}
          <QuizReview
            questions={review.steps}
            userAnswers={review.answers}
            score={result.score}
            totalQuestions={review.totalQuestions}
            passed={result.passed}
            onRetry={handleRetry}
            onContinue={onClose}
          />
        </div>
      );
    }

  if (showResult && result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4",
            result.passed ? "bg-green-500/20" : "bg-red-500/20"
          )}>
            {result.passed ? (
              <Trophy className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {result.passed ? '🎉 Parabéns!' : 'Continue tentando!'}
          </CardTitle>
          <CardDescription>
            {result.passed 
              ? 'Você passou no quiz!' 
              : `Você precisa de ${quiz.passing_score}% para passar.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{result.score}%</div>
            <p className="text-muted-foreground">Pontuação</p>
          </div>

          {result.xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg">
              <Star className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">+{result.xpEarned} XP ganhos!</span>
            </div>
          )}

          <div className="flex gap-3">
            {!result.passed && (
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              {result.passed ? 'Continuar' : 'Fechar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-4">
          <Badge variant="outline">
            Questão {currentQuestionIndex + 1} de {quiz.quiz_questions.length}
          </Badge>
                  <div className="flex items-center gap-2">
                    {timeLeft !== null && (
                      <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(timeLeft)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={requestExit}
                      className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                      aria-label="Sair do quiz"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                      Sair
                    </Button>
                  </div>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-4 text-lg">{quiz.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentQuestion.question_text}</div>

        <div className="space-y-3">
          {currentQuestion.quiz_options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={showExplanation}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  isSelected && "border-primary bg-primary/10",
                  showExplanation && "cursor-default"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected && "border-primary bg-primary"
                  )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="flex-1">{option.option_text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Explicação:</p>
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex gap-3">
          {hasAnswered && !showExplanation && currentQuestion.explanation && (
            <Button 
              variant="outline" 
              onClick={() => setShowExplanation(true)}
              className="flex-1"
            >
              Ver explicação
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!hasAnswered || loading}
            className="flex-1"
          >
            {loading ? 'Enviando...' : isLastQuestion ? 'Finalizar' : 'Próxima'}
            {!isLastQuestion && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>

      <AlertDialog
              open={exitGuard.showDialog}
        onOpenChange={(open) => {
                if (!open) exitGuard.handleCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-center">Sair do Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
                          {exitGuard.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Continuar Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={exitGuard.handleConfirm} className="bg-destructive hover:bg-destructive/90">
              Sair mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
