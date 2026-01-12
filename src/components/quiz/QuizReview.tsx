import { motion } from "framer-motion";
import { Check, X, Lightbulb, ArrowRight, RotateCcw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuizQuestion {
  id: string;
  question_text: string;
  explanation?: string;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
  }[];
}

interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

interface QuizReviewProps {
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  onRetry?: () => void;
  onContinue?: () => void;
  onGoToLesson?: (questionId: string) => void;
}

const QuizReview = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  passed,
  onRetry,
  onContinue,
  onGoToLesson,
}: QuizReviewProps) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  const getQuestionStatus = (questionId: string) => {
    const answer = userAnswers.find((a) => a.questionId === questionId);
    return answer?.isCorrect ?? false;
  };

  const getUserAnswer = (questionId: string) => {
    const answer = userAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedOptionId;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={`border-2 ${passed ? "border-emerald-500/50 bg-emerald-500/5" : "border-rose-500/50 bg-rose-500/5"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {passed ? (
                <Check className="h-6 w-6 text-emerald-500" />
              ) : (
                <X className="h-6 w-6 text-rose-500" />
              )}
              Revisão do Quiz
            </span>
            <Badge
              variant="outline"
              className={passed ? "border-emerald-500 text-emerald-500" : "border-rose-500 text-rose-500"}
            >
              {percentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Você acertou <span className="font-bold text-foreground">{correctCount}</span> de{" "}
              <span className="font-bold text-foreground">{totalQuestions}</span> questões
            </span>
            <span className={passed ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
              {passed ? "Aprovado! 🎉" : "Tente novamente"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {questions.map((question, index) => {
            const isCorrect = getQuestionStatus(question.id);
            const userAnswerId = getUserAnswer(question.id);
            const correctOption = question.options.find((o) => o.is_correct);

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border ${isCorrect ? "border-emerald-500/30" : "border-rose-500/30"}`}>
                  <CardContent className="pt-4">
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        }`}
                      >
                        {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Questão {index + 1}</p>
                        <p className="font-medium text-foreground">{question.question_text}</p>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 ml-11">
                      {question.options.map((option) => {
                        const isSelected = option.id === userAnswerId;
                        const isCorrectOption = option.is_correct;

                        let optionClass = "border-border bg-muted/30";
                        if (isCorrectOption) {
                          optionClass = "border-emerald-500 bg-emerald-500/10";
                        } else if (isSelected && !isCorrectOption) {
                          optionClass = "border-rose-500 bg-rose-500/10";
                        }

                        return (
                          <div
                            key={option.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${optionClass}`}
                          >
                            <div className="flex-shrink-0">
                              {isCorrectOption ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : isSelected ? (
                                <X className="h-4 w-4 text-rose-500" />
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                isCorrectOption
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : isSelected
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {option.option_text}
                            </span>
                            {isSelected && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                Sua resposta
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 ml-11 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-primary mb-1">Explicação</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Link to Lesson */}
                    {!isCorrect && onGoToLesson && (
                      <div className="mt-3 ml-11">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onGoToLesson(question.id)}
                          className="text-primary hover:text-primary/80 gap-2 h-8"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Revisar conteúdo relacionado
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        {onRetry && !passed && (
          <Button variant="outline" onClick={onRetry} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
        {onContinue && (
          <Button onClick={onContinue} className="flex-1 gap-2">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizReview;
