import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp } from 'lucide-react';
import {
  describeAdaptiveFeedback,
  describeDifficultyBreakdown,
  describeXpBonus,
  difficultyBadgeClass,
  difficultyLabel,
} from '@/lib/quizAdaptive';
import { cn } from '@/lib/utils';

interface QuizAdaptiveResultProps {
  weightedScore?: number;
  xpBonus?: number;
  byDifficulty?: Record<string, { total: number; correct: number }>;
  recommendedDifficulty?: string;
}

/** FUNC-020: resumo do modo adaptativo na tela de resultado do quiz. */
const QuizAdaptiveResult = ({
  weightedScore,
  xpBonus,
  byDifficulty,
  recommendedDifficulty,
}: QuizAdaptiveResultProps) => {
  const breakdown = describeDifficultyBreakdown(byDifficulty);
  const bonus = describeXpBonus(xpBonus);

  if (typeof weightedScore !== 'number' && !breakdown && !recommendedDifficulty) return null;

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="font-medium">Modo adaptativo</span>
        {typeof weightedScore === 'number' && (
          <Badge variant="secondary">{weightedScore}% ponderado</Badge>
        )}
        {recommendedDifficulty && (
          <Badge variant="outline" className={cn(difficultyBadgeClass(recommendedDifficulty))}>
            Próximo nível: {difficultyLabel(recommendedDifficulty)}
          </Badge>
        )}
      </div>
      {breakdown && <p className="text-muted-foreground">Acertos por nível: {breakdown}</p>}
      {bonus && (
        <p className="text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          {bonus}
        </p>
      )}
      <p className="text-muted-foreground">
        {describeAdaptiveFeedback(recommendedDifficulty, weightedScore)}
      </p>
    </div>
  );
};

export default QuizAdaptiveResult;