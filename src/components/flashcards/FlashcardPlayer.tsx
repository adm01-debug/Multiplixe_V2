import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import IconTooltip from '@/components/ui/icon-tooltip';
import { cn } from '@/lib/utils';
import {
  FLASHCARD_GRADES,
  describeDue,
  masteryLabel,
  nextFlashcardState,
  type FlashcardGrade,
} from '@/lib/flashcardSrs';
import { currentProgressOf, type DueFlashcard } from '@/hooks/useFlashcards';

interface FlashcardPlayerProps {
  card: DueFlashcard;
  deckName?: string | null;
  position: { atual: number; total: number };
  progressPercent: number;
  reviewing?: boolean;
  onGrade: (grade: FlashcardGrade) => void;
}

/**
 * Cartão de revisão: frente -> resposta -> nota. As previsões de prazo ao lado
 * de cada botão saem das mesmas regras do SRS aplicadas no banco.
 */
const FlashcardPlayer = ({
  card,
  deckName,
  position,
  progressPercent,
  reviewing = false,
  onGrade,
}: FlashcardPlayerProps) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!revealed && (event.code === 'Space' || event.code === 'Enter')) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (!revealed) return;
      const atalho: Record<string, FlashcardGrade> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
      const grade = atalho[event.code];
      if (grade !== undefined) {
        event.preventDefault();
        onGrade(grade);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onGrade, revealed]);

  const progresso = currentProgressOf(card);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Cartão {position.atual} de {position.total}
          {deckName ? ` · ${deckName}` : ''}
        </span>
        <span className="flex items-center gap-2">
          <Badge variant="secondary">{masteryLabel(card.repetitions)}</Badge>
          <span>{describeDue(card.due_at)}</span>
        </span>
      </div>
      <Progress value={progressPercent} aria-label="Progresso da revisão" />

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pergunta</p>
            <p className="text-lg sm:text-xl font-semibold leading-relaxed">{card.front}</p>
          </div>

          {revealed ? (
            <div className="space-y-2 border-t border-border/60 pt-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resposta</p>
              <p className="text-base leading-relaxed text-foreground">{card.back}</p>
              {card.hint && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                  {card.hint}
                </p>
              )}
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setRevealed(true)}>
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
              Mostrar resposta
            </Button>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Como foi?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FLASHCARD_GRADES.map(option => {
              const destino = nextFlashcardState(progresso, option.grade);
              return (
                <IconTooltip
                  key={option.grade}
                  label={`${option.label}: ${option.hint} · +${option.xp} XP`}
                >
                  <Button
                    variant="outline"
                    className={cn('w-full h-auto flex-col gap-0.5 py-3', option.className)}
                    disabled={reviewing}
                    onClick={() => onGrade(option.grade)}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-[11px] opacity-80 flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      {destino.label}
                    </span>
                    <span className="text-[11px] font-medium">+{option.xp} XP</span>
                  </Button>
                </IconTooltip>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Atalhos: espaço mostra a resposta; 1 a 4 dão a nota.
          </p>
        </div>
      )}
    </div>
  );
};

export default FlashcardPlayer;