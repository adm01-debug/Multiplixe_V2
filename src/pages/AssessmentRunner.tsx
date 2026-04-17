import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSubmitAssessment } from '@/hooks/useSkillAssessments';
import { toast } from 'sonner';

interface QOption { id: string; option_text: string; order_index: number; }
interface QQuestion { id: string; question_text: string; order_index: number; quiz_options: QOption[]; }

const AssessmentRunner = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const submit = useSubmitAssessment();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<{ score: number; passed: boolean } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assessment-runner', id],
    queryFn: async () => {
      const { data: assessment, error: e1 } = await supabase
        .from('skill_assessments').select('*').eq('id', id).maybeSingle();
      if (e1) throw e1;
      if (!assessment?.quiz_id) return { assessment, questions: [] as QQuestion[] };

      const { data: questions, error: e2 } = await supabase
        .from('quiz_questions')
        .select('id, question_text, order_index')
        .eq('quiz_id', assessment.quiz_id)
        .order('order_index');
      if (e2) throw e2;

      const qIds = (questions || []).map(q => q.id);
      const { data: opts } = qIds.length > 0
        ? await supabase
            .from('quiz_options_public' as never)
            .select('id, question_id, option_text, order_index')
            .in('question_id', qIds)
        : { data: [] as Array<{ id: string; question_id: string; option_text: string; order_index: number }> };

      const optsByQ = (opts || []).reduce<Record<string, QOption[]>>((acc, o) => {
        const opt = o as { id: string; question_id: string; option_text: string; order_index: number };
        (acc[opt.question_id] ||= []).push({ id: opt.id, option_text: opt.option_text, order_index: opt.order_index });
        return acc;
      }, {});

      const merged: QQuestion[] = (questions || []).map(q => ({
        id: q.id,
        question_text: q.question_text,
        order_index: q.order_index,
        quiz_options: optsByQ[q.id] || [],
      }));

      return { assessment, questions: merged };
    },
    enabled: !!id,
  });

  useEffect(() => { if (!isLoading && data && !data.assessment) toast.error('Avaliação não encontrada'); }, [isLoading, data]);

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-96" /></div>;
  if (!data?.assessment) return <div className="container mx-auto p-8 text-center"><Button onClick={() => navigate('/avaliacoes')}>Voltar</Button></div>;

  const { assessment, questions } = data;
  const total = questions.length;
  const answered = Object.keys(answers).length;

  const handleSubmit = async () => {
    if (!assessment.quiz_id) return;

    const answersPayload = Object.entries(answers).map(([question_id, option_id]) => ({ question_id, option_id }));
    const { data: rpcData, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: assessment.quiz_id,
      p_answers: answersPayload,
    });

    if (error || !rpcData || rpcData.length === 0) {
      toast.error('Erro ao validar avaliação');
      return;
    }

    const result = rpcData[0];
    const score = result.score;
    const passed = score >= assessment.passing_score;
    const gaps = questions.filter(q => !answers[q.id]).map(q => q.question_text);

    submit.mutate({
      assessmentId: assessment.id,
      score,
      passingScore: assessment.passing_score,
      frequencyDays: assessment.frequency_days,
      gaps,
    });
    setSubmitted({ score, passed });
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            {submitted.passed ? <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" /> : <XCircle className="h-16 w-16 text-destructive mx-auto" />}
            <CardTitle className="text-3xl mt-4">{submitted.passed ? 'Aprovado!' : 'Continue praticando'}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-5xl font-bold">{submitted.score}%</p>
            <p className="text-muted-foreground">Nota mínima: {assessment.passing_score}%</p>
            <Button onClick={() => navigate('/avaliacoes')} className="mt-4">Voltar para avaliações</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/avaliacoes')} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{assessment.title}</h1>
            <Progress value={(answered / Math.max(total, 1)) * 100} className="h-1.5 mt-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {questions.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma pergunta vinculada a esta avaliação.</CardContent></Card>
        ) : questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">{idx + 1}. {q.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={answers[q.id] || ''} onValueChange={(v) => setAnswers(a => ({ ...a, [q.id]: v }))}>
                {q.quiz_options.sort((a, b) => a.order_index - b.order_index).map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1">{opt.option_text}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
        {questions.length > 0 && (
          <Button size="lg" className="w-full" disabled={answered < total || submit.isPending} onClick={handleSubmit}>
            Enviar avaliação ({answered}/{total})
          </Button>
        )}
      </main>
    </div>
  );
};

export default AssessmentRunner;
