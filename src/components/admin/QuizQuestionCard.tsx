import { memo } from 'react';
import { Button } from '@/components/ui/button';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUIZ_DIFFICULTIES, QUIZ_DIFFICULTY_LABELS } from '@/lib/quizAdaptive';
import { Plus, Trash2, GripVertical, Info } from 'lucide-react';

interface QuizOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizQuestion {
  id?: string;
  question_text: string;
  explanation: string;
  order_index: number;
  difficulty_level?: string;
  options: QuizOption[];
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  onRemove: () => void;
  onUpdateQuestion: (field: keyof QuizQuestion, value: string) => void;
  onUpdateOption: (optionIndex: number, field: keyof QuizOption, value: string | boolean) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
}

const QuizQuestionCard = ({
  question, index, onRemove,
  onUpdateQuestion, onUpdateOption, onAddOption, onRemoveOption,
}: QuizQuestionCardProps) => {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Badge>Questão {index + 1}</Badge>
              <div className="flex items-center gap-1">
                <Select
                  value={question.difficulty_level || 'medio'}
                  onValueChange={(value) => onUpdateQuestion('difficulty_level', value)}
                >
                  <SelectTrigger className="h-8 w-[120px]" aria-label="Nível de dificuldade da questão">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIZ_DIFFICULTIES.map((level) => (
                      <SelectItem key={level} value={level}>
                        {QUIZ_DIFFICULTY_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <IconTooltip label="Como funciona o nível de dificuldade: Fácil vale 1 ponto e 2 XP de bônus; Médio, 1,5 ponto e 5 XP; Difícil, 2 pontos e 10 XP. O quiz adaptativo usa esses níveis para escolher as próximas questões.">
                  <span className="inline-flex cursor-help text-muted-foreground">
                    <Info className="w-4 h-4" aria-hidden="true" />
                  </span>
                </IconTooltip>
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            <Textarea
              value={question.question_text}
              onChange={(e) => onUpdateQuestion('question_text', e.target.value)}
              placeholder="Digite a pergunta..."
              className="mb-2"
            />
            <Input aria-label="Explicação da resposta"
              value={question.explanation}
              onChange={(e) => onUpdateQuestion('explanation', e.target.value)}
              placeholder="Explicação (opcional)"
              className="text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {question.options.map((option, oIndex) => (
            <div key={oIndex} className="flex items-center gap-2">
              <Switch
                checked={option.is_correct}
                onCheckedChange={(checked) => onUpdateOption(oIndex, 'is_correct', checked)}
              />
              <Input aria-label="Texto da opção"
                value={option.option_text}
                onChange={(e) => onUpdateOption(oIndex, 'option_text', e.target.value)}
                placeholder={`Opção ${oIndex + 1}`}
                className={option.is_correct ? 'border-green-500' : ''}
              />
              {question.options.length > 2 && (
                <IconTooltip label="Remover opção"><Button variant="ghost" size="icon" aria-label="Remover opção" onClick={() => onRemoveOption(oIndex)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button></IconTooltip>
              )}
            </div>
          ))}
          {question.options.length < 6 && (
            <Button variant="outline" size="sm" onClick={onAddOption} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Opção
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(QuizQuestionCard);
