import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useDefaultWorkflowProgress,
  useUpdateOnboardingProgress,
  type OnboardingStep,
} from "@/hooks/useOnboardingWorkflow";
import { useConfetti } from "@/hooks/useConfetti";
import DynamicSEO from "@/components/seo/DynamicSEO";

const OnboardingRuntime = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { data, isLoading } = useDefaultWorkflowProgress();
  const update = useUpdateOnboardingProgress();
  const fire = useConfetti();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !data && workflowId !== "default") {
      navigate("/onboarding");
    }
  }, [isLoading, data, workflowId, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-3xl space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.workflow) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Nenhum workflow disponível</h1>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const steps = data.workflow.steps;
  const completed = new Set(data.progress?.completed_steps ?? []);
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => completed.has(s.id)).length;
  const percent = totalSteps ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isComplete = totalSteps > 0 && completedCount >= totalSteps;

  const handleComplete = async (step: OnboardingStep) => {
    await update.mutateAsync({
      workflowId: data.workflow.id,
      stepId: step.id,
      totalSteps,
    });
    setActive(null);
    if (completedCount + 1 >= totalSteps) fire();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <DynamicSEO
        title={`Onboarding: ${data.workflow.name}`}
        description={data.workflow.description ?? "Programa de onboarding"}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{data.workflow.name}</h1>
        {data.workflow.description && (
          <p className="text-muted-foreground">{data.workflow.description}</p>
        )}
        <div className="mt-4 flex items-center gap-3" role="status">
          <Progress value={percent} className="flex-1" />
          <span className="text-sm font-medium">
            {completedCount}/{totalSteps} ({percent}%)
          </span>
        </div>
      </header>

      {isComplete && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <Trophy className="h-10 w-10 text-primary" />
            <div>
              <h2 className="font-bold text-lg">Onboarding concluído! 🎉</h2>
              <p className="text-sm text-muted-foreground">Você completou todas as etapas.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {steps.map((step, idx) => {
          const done = completed.has(step.id);
          const isActive = active === step.id;
          return (
            <li key={step.id}>
              <Card className={done ? "border-primary/30 bg-primary/5" : ""}>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" aria-label="Concluído" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {idx + 1}. {step.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize">{step.type}</Badge>
                </CardHeader>
                {(isActive || !done) && (
                  <CardContent className="space-y-3">
                    {step.description && (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {step.resource_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={step.resource_url} target="_blank" rel="noopener noreferrer">
                            Abrir recurso <ArrowRight className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {!done && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(step)}
                          disabled={update.isPending}
                        >
                          Marcar como concluído
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OnboardingRuntime;
