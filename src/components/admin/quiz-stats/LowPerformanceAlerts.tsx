import { AlertTriangle, XCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CourseQuizStat } from './types';

interface Props {
  stats: CourseQuizStat[];
  onRegisterAlert: (quiz: CourseQuizStat) => void;
  onToggleHistory: () => void;
  showAlertHistory: boolean;
}

const LowPerformanceAlerts = ({ stats, onRegisterAlert, onToggleHistory, showAlertHistory }: Props) => {
  const lowPerformance = stats.filter(s => s.totalAttempts >= 5 && s.passingRate < 50);
  if (lowPerformance.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-destructive">Quizzes com Taxa de Aprovação Baixa (&lt;50%)</h4>
            <Button variant="outline" size="sm" onClick={onToggleHistory} className="gap-2">
              <History className="h-4 w-4" />Histórico
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Os seguintes quizzes precisam de atenção - considere revisar o conteúdo ou as perguntas:</p>
          <div className="space-y-2">
            {lowPerformance.sort((a, b) => a.passingRate - b.passingRate).map((quiz) => (
              <div key={quiz.quizId} className="flex items-center justify-between p-3 rounded-lg bg-background/60 border border-border/50">
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium text-sm">{quiz.quizTitle}</p>
                    <p className="text-xs text-muted-foreground">{quiz.courseTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-destructive">{quiz.passingRate}%</p>
                    <p className="text-xs text-muted-foreground">{quiz.passedAttempts}/{quiz.totalAttempts} aprovados</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRegisterAlert(quiz)} className="text-xs">Registrar</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <p className="font-medium mb-1">💡 Sugestões:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Revise as perguntas para garantir que estão claras</li>
              <li>Verifique se o conteúdo das aulas cobre os tópicos do quiz</li>
              <li>Considere adicionar explicações mais detalhadas nas respostas</li>
              <li>Avalie se a nota de aprovação está adequada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowPerformanceAlerts;
