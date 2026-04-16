import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDueAssessments, useUserAssessmentResults, type DueAssessment } from '@/hooks/useSkillAssessments';
import EmptyState from '@/components/EmptyState';

const statusMap: Record<DueAssessment['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Target }> = {
  pending: { label: 'Nunca realizada', variant: 'secondary', icon: Target },
  overdue: { label: 'Vencida', variant: 'destructive', icon: AlertTriangle },
  due_soon: { label: 'Vence em breve', variant: 'outline', icon: Clock },
  on_track: { label: 'Em dia', variant: 'default', icon: CheckCircle2 },
};

const SkillAssessments = () => {
  const navigate = useNavigate();
  const { data: due = [], isLoading: loadDue } = useDueAssessments();
  const { data: results = [], isLoading: loadRes } = useUserAssessmentResults();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Avaliações de Competência</h1>
              <p className="text-sm text-muted-foreground">Acompanhe e mantenha suas habilidades em dia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Avaliações disponíveis</h2>
          {loadDue ? (
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : due.length === 0 ? (
            <EmptyState icon={Target} title="Nenhuma avaliação ativa" description="Aguarde novas avaliações serem publicadas." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {due.map(a => {
                const meta = statusMap[a.status];
                const Icon = meta.icon;
                return (
                  <Card key={a.assessment_id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant={meta.variant} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{a.skill_area}</Badge>
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {a.last_completed_at
                          ? `Última: ${new Date(a.last_completed_at).toLocaleDateString('pt-BR')}`
                          : 'Nunca realizada'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Frequência: {a.frequency_days} dias · Nota mínima: {a.passing_score}%
                      </div>
                      <Button
                        className="w-full"
                        disabled={!a.quiz_id}
                        onClick={() => a.quiz_id && navigate(`/avaliacao/${a.assessment_id}`)}
                      >
                        {a.last_completed_at ? 'Refazer avaliação' : 'Iniciar avaliação'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Histórico</h2>
          {loadRes ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não realizou nenhuma avaliação.</p>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {results.map(r => (
                    <div key={r.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Score: {r.score}%</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.completed_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <Badge variant={r.passed ? 'default' : 'destructive'}>{r.passed ? 'Aprovado' : 'Reprovado'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default SkillAssessments;
