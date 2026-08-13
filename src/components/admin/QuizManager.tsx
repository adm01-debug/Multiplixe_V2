import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, FileQuestion, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuizQuestionCard from './QuizQuestionCard';
import AIQuizGeneratorModal, { type GeneratedQuestion } from './AIQuizGeneratorModal';

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
  options: QuizOption[];
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  passing_score: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  cooldown_hours: number;
  questions: QuizQuestion[];
}

interface QuizManagerProps {
  lessonId?: string;
  courseId?: string;
  onClose: () => void;
}

export const QuizManager = ({ lessonId, courseId, onClose }: QuizManagerProps) => {
  const [quiz, setQuiz] = useState<Quiz>({
    title: 'Quiz da aula', description: '', passing_score: 90,
    xp_reward: 50, time_limit_seconds: null, cooldown_hours: 24, questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const handleAIQuestions = (generated: GeneratedQuestion[]) => {
    setQuiz((prev) => {
      const baseIndex = prev.questions.length;
      const mapped: QuizQuestion[] = generated.map((g, i) => ({
        question_text: g.question_text,
        explanation: g.explanation ?? '',
        order_index: baseIndex + i,
        options: g.options.map((o, oi) => ({
          option_text: o.option_text,
          is_correct: o.is_correct,
          order_index: oi,
        })),
      }));
      return { ...prev, questions: [...prev.questions, ...mapped] };
    });
    toast.success(`${generated.length} questões adicionadas`);
  };

  useEffect(() => { loadExistingQuiz(); }, [lessonId, courseId]);

  const loadExistingQuiz = async () => {
    try {
      let query = supabase.from('quizzes').select(`*, quiz_questions (*, quiz_options (*))`);
      if (lessonId) query = query.eq('lesson_id', lessonId);
      else if (courseId) query = query.eq('course_id', courseId).is('lesson_id', null);

      const { data, error } = await query.maybeSingle();
      if (error || !data) return;

      setExistingQuizId(data.id);
      setQuiz({
        id: data.id, title: data.title, description: data.description || '',
        passing_score: data.passing_score, xp_reward: data.xp_reward,
        time_limit_seconds: data.time_limit_seconds, cooldown_hours: data.cooldown_hours || 24,
        questions: data.quiz_questions
          .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
          .map((q: { id: string; question_text: string; explanation: string | null; order_index: number; quiz_options: Array<{ id: string; option_text: string; is_correct: boolean; order_index: number }> }) => ({
            id: q.id, question_text: q.question_text, explanation: q.explanation || '',
            order_index: q.order_index,
            options: q.quiz_options
              .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
              .map((o: { id: string; option_text: string; is_correct: boolean; order_index: number }) => ({
                id: o.id, option_text: o.option_text, is_correct: o.is_correct, order_index: o.order_index,
              })),
          })),
      });
    } catch { /* Silent fail */ }
  };

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question_text: '', explanation: '', order_index: prev.questions.length,
        options: [
          { option_text: '', is_correct: true, order_index: 0 },
          { option_text: '', is_correct: false, order_index: 1 },
          { option_text: '', is_correct: false, order_index: 2 },
          { option_text: '', is_correct: false, order_index: 3 },
        ],
      }],
    }));
  };

  const removeQuestion = (index: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i })),
    }));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q),
    }));
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof QuizOption, value: string | boolean) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) => {
        if (qi !== qIndex) return q;
        return {
          ...q,
          options: q.options.map((o, oi) => {
            if (oi !== oIndex) return field === 'is_correct' && value === true ? { ...o, is_correct: false } : o;
            return { ...o, [field]: value };
          }),
        };
      }),
    }));
  };

  const addOption = (qIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi !== qIndex ? q : { ...q, options: [...q.options, { option_text: '', is_correct: false, order_index: q.options.length }] }
      ),
    }));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi !== qIndex ? q : { ...q, options: q.options.filter((_, i) => i !== oIndex).map((o, i) => ({ ...o, order_index: i })) }
      ),
    }));
  };

  const handleSave = async () => {
    if (quiz.questions.length === 0) { toast.error('Adicione pelo menos uma questão'); return; }
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question_text.trim()) { toast.error(`Questão ${i + 1} está sem texto`); return; }
      if (q.options.filter(o => o.option_text.trim()).length < 2) { toast.error(`Questão ${i + 1} precisa de pelo menos 2 opções`); return; }
      if (!q.options.some(o => o.is_correct)) { toast.error(`Questão ${i + 1} precisa ter uma resposta correta`); return; }
    }

    setLoading(true);
    try {
      if (existingQuizId) await supabase.from('quizzes').delete().eq('id', existingQuizId);

      const { data: newQuiz, error: quizError } = await supabase.from('quizzes').insert({
        lesson_id: lessonId || null, course_id: courseId || null, title: quiz.title,
        description: quiz.description || null, passing_score: quiz.passing_score,
        xp_reward: quiz.xp_reward, time_limit_seconds: quiz.time_limit_seconds, cooldown_hours: quiz.cooldown_hours,
      }).select().single();
      if (quizError) throw quizError;

      for (const question of quiz.questions) {
        const { data: newQuestion, error: questionError } = await supabase.from('quiz_questions').insert({
          quiz_id: newQuiz.id, question_text: question.question_text,
          explanation: question.explanation || null, order_index: question.order_index,
        }).select().single();
        if (questionError) throw questionError;

        const validOptions = question.options.filter(o => o.option_text.trim());
        const { error: optionsError } = await supabase.from('quiz_options').insert(
          validOptions.map(option => ({
            question_id: newQuestion.id, option_text: option.option_text,
            is_correct: option.is_correct, order_index: option.order_index,
          }))
        );
        if (optionsError) throw optionsError;
      }

      toast.success('Quiz salvo com sucesso!');
      onClose();
    } catch { toast.error('Erro ao salvar quiz'); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!existingQuizId || !confirm('Tem certeza que deseja excluir este quiz?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', existingQuizId);
      if (error) throw error;
      toast.success('Quiz excluído');
      onClose();
    } catch { toast.error('Erro ao excluir quiz'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileQuestion className="w-5 h-5" />Gerenciar Quiz
        </h2>
        {existingQuizId && (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />Excluir Quiz
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label htmlFor="title">Título do Quiz</Label><Input id="title" value={quiz.title} onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))} /></div>
        <div><Label htmlFor="xp">XP de Recompensa</Label><Input id="xp" type="number" value={quiz.xp_reward} onChange={(e) => setQuiz(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))} /></div>
        <div><Label htmlFor="passing">Pontuação Mínima (%)</Label><Input id="passing" type="number" min="0" max="100" value={quiz.passing_score} onChange={(e) => setQuiz(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 90 }))} /></div>
        <div><Label htmlFor="cooldown">Cooldown (horas)</Label><Input id="cooldown" type="number" min="0" max="720" value={quiz.cooldown_hours} onChange={(e) => setQuiz(prev => ({ ...prev, cooldown_hours: parseInt(e.target.value) || 0 }))} /></div>
        <div><Label htmlFor="time">Tempo Limite (seg, opcional)</Label><Input id="time" type="number" value={quiz.time_limit_seconds || ''} onChange={(e) => setQuiz(prev => ({ ...prev, time_limit_seconds: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Sem limite" /></div>
      </div>

      <div><Label htmlFor="description">Descrição (opcional)</Label><Textarea id="description" value={quiz.description} onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))} /></div>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Questões ({quiz.questions.length})</h3>
          <div className="flex gap-2">
            <Button onClick={() => setAiOpen(true)} size="sm" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2" />Gerar com IA
            </Button>
            <Button onClick={addQuestion} size="sm"><Plus className="w-4 h-4 mr-2" />Adicionar Questão</Button>
          </div>
        </div>
        <AIQuizGeneratorModal open={aiOpen} onOpenChange={setAiOpen} onAccept={handleAIQuestions} />

        {quiz.questions.map((question, qIndex) => (
          <QuizQuestionCard
            key={qIndex}
            question={question}
            index={qIndex}
            onRemove={() => removeQuestion(qIndex)}
            onUpdateQuestion={(field, value) => updateQuestion(qIndex, field, value)}
            onUpdateOption={(oIndex, field, value) => updateOption(qIndex, oIndex, field, value)}
            onAddOption={() => addOption(qIndex)}
            onRemoveOption={(oIndex) => removeOption(qIndex, oIndex)}
          />
        ))}

        {quiz.questions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileQuestion className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma questão adicionada</p>
            <p className="text-sm">Clique em "Adicionar Questão" para começar</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={loading}><Save className="w-4 h-4 mr-2" />{loading ? 'Salvando...' : 'Salvar Quiz'}</Button>
      </div>
    </div>
  );
};
