import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, AlertCircle, ArrowRight } from 'lucide-react';
import { useDueAssessments } from '@/hooks/useSkillAssessments';

const DueAssessmentsWidget = () => {
  const navigate = useNavigate();
  const { data: due = [] } = useDueAssessments();
  const pending = due.filter(d => d.status === 'pending' || d.status === 'overdue' || d.status === 'due_soon');
  if (pending.length === 0) return null;

  const overdueCount = due.filter(d => d.status === 'overdue').length;

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-warning" />
            <CardTitle className="text-base">Avaliações Pendentes</CardTitle>
          </div>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {pending.slice(0, 3).map(a => (
            <li key={a.assessment_id} className="flex items-center justify-between text-sm">
              <span className="truncate">{a.title}</span>
              <Badge variant={a.status === 'overdue' ? 'destructive' : 'secondary'} className="ml-2 shrink-0">
                {a.status === 'overdue' ? 'Vencida' : a.status === 'pending' ? 'Pendente' : 'Em breve'}
              </Badge>
            </li>
          ))}
        </ul>
        <Button size="sm" className="w-full" onClick={() => navigate('/avaliacoes')}>
          Ver todas <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default DueAssessmentsWidget;
