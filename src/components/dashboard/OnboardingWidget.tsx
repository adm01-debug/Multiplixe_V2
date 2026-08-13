import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useDefaultWorkflowProgress } from '@/hooks/useOnboardingWorkflow';

const OnboardingWidget = () => {
  const navigate = useNavigate();
  const { data } = useDefaultWorkflowProgress();
  if (!data?.workflow) return null;
  const total = data.workflow.steps.length;
  const done = data.progress?.completed_steps?.length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  if (pct === 100) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <CardTitle className="text-base">{data.workflow.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{done}/{total} passos · {pct}%</span>
          <Button size="sm" variant="ghost" onClick={() => navigate('/onboarding')}>
            Continuar <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingWidget;
