import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Sparkles, Video, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDefaultWorkflowProgress, useUpdateOnboardingProgress, type OnboardingStepType } from '@/hooks/useOnboardingWorkflow';
import EmptyState from '@/components/SimpleEmptyState';

const stepIcon: Record<OnboardingStepType, typeof Video> = {
  video: Video,
  playbook: BookOpen,
  quiz: Target,
  course: Sparkles,
  task: CheckCircle2,
};

const SalesOnboarding = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useDefaultWorkflowProgress();
  const update = useUpdateOnboardingProgress();

  if (isLoading) {
    return <div className="container mx-auto p-8 space-y-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  }

  if (!data?.workflow) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState icon={Sparkles} title="Nenhum workflow ativo" description="Aguarde um administrador configurar seu plano de onboarding." />
      </div>
    );
  }

  const { workflow, progress } = data;
  const completed = new Set(progress?.completed_steps || []);
  const total = workflow.steps.length;
  const pct = total > 0 ? Math.round((completed.size / total) * 100) : 0;

  const handleStepClick = (step: typeof workflow.steps[0]) => {
    if (!completed.has(step.id)) {
      update.mutate({ workflowId: workflow.id, stepId: step.id, totalSteps: total });
    }
    if (step.resource_url) navigate(step.resource_url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground">{workflow.description || 'Seu plano de onboarding'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progresso geral</CardTitle>
              <Badge variant={pct === 100 ? 'default' : 'secondary'}>{completed.size}/{total} concluídos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={pct} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">{pct}% completo</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {workflow.steps.map((step, idx) => {
            const isDone = completed.has(step.id);
            const Icon = stepIcon[step.type] || Circle;
            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all ${isDone ? 'opacity-70 border-emerald-500/40' : 'hover:border-primary/50'}`}
                onClick={() => handleStepClick(step)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted'}`}>
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Passo {idx + 1}</span>
                      <Badge variant="outline" className="text-xs capitalize">{step.type}</Badge>
                      {step.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                    </div>
                    <h3 className={`font-medium ${isDone ? 'line-through' : ''}`}>{step.title}</h3>
                    {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                  </div>
                  {step.resource_url && <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SalesOnboarding;
