import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { INITIAL_PROGRESS, type FlashcardGrade, type FlashcardProgressState } from '@/lib/flashcardSrs';

export interface FlashcardDeck {
  course_id: string;
  titulo: string;
  slug: string | null;
  total: number;
  pendentes: number;
  dominados: number;
}

export interface FlashcardOverview {
  decks: FlashcardDeck[];
  total: number;
  pendentes: number;
  novos: number;
  dominados: number;
}

export interface DueFlashcard {
  id: string;
  course_id: string;
  lesson_id: string | null;
  front: string;
  back: string;
  hint: string | null;
  due_at: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  is_new: boolean;
}

export interface FlashcardReviewResult {
  flashcard_id: string;
  grade: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  xp_awarded: number;
  mastered: boolean;
}

export interface FlashcardSessionSummary {
  revisados: number;
  acertos: number;
  lapsos: number;
  dominados: number;
  xp: number;
}

const SESSION_SIZE = 30;

export const useFlashcardOverview = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcards', 'overview'],
    enabled: !!user,
    queryFn: async (): Promise<FlashcardOverview> => {
      const { data, error } = await supabase.rpc('get_flashcard_overview');
      if (error) throw error;
      const raw = (data ?? {}) as unknown as Partial<FlashcardOverview>;
      return {
        decks: raw.decks ?? [],
        total: raw.total ?? 0,
        pendentes: raw.pendentes ?? 0,
        novos: raw.novos ?? 0,
        dominados: raw.dominados ?? 0,
      };
    },
  });
};

export const useFlashcardSession = (courseId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<DueFlashcard[]>([]);
  const [cursor, setCursor] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [lastResult, setLastResult] = useState<FlashcardReviewResult | null>(null);
  const [summary, setSummary] = useState<FlashcardSessionSummary>({
    revisados: 0,
    acertos: 0,
    lapsos: 0,
    dominados: 0,
    xp: 0,
  });

  const start = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLastResult(null);
    setSummary({ revisados: 0, acertos: 0, lapsos: 0, dominados: 0, xp: 0 });
    const { data, error } = await supabase.rpc('get_due_flashcards', {
      p_course_id: courseId,
      p_limit: SESSION_SIZE,
    });
    if (error) {
      toast.error('Não foi possível carregar os flashcards');
      setLoading(false);
      return;
    }
    setQueue((data ?? []) as unknown as DueFlashcard[]);
    setCursor(0);
    setStarted(true);
    setLoading(false);
  }, [courseId, user]);

  const review = useCallback(
    async (grade: FlashcardGrade) => {
      const card = queue[cursor];
      if (!card || !user || reviewing) return;

      setReviewing(true);
      const { data, error } = await supabase.rpc('review_flashcard', {
        p_flashcard_id: card.id,
        p_grade: grade,
      });
      setReviewing(false);

      if (error) {
        toast.error('Não foi possível salvar a revisão');
        return;
      }

      const result = data as unknown as FlashcardReviewResult;
      setLastResult(result);
      setSummary(prev => ({
        revisados: prev.revisados + 1,
        acertos: prev.acertos + (grade > 0 ? 1 : 0),
        lapsos: prev.lapsos + (grade === 0 ? 1 : 0),
        dominados: prev.dominados + (result.mastered ? 1 : 0),
        xp: prev.xp + (result.xp_awarded ?? 0),
      }));
      if (result.xp_awarded > 0) {
        toast.success(`+${result.xp_awarded} XP`);
      }
      setCursor(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['flashcards', 'overview'] });
    },
    [cursor, queryClient, queue, reviewing, user],
  );

  const reset = useCallback(() => {
    setStarted(false);
    setQueue([]);
    setCursor(0);
    setLastResult(null);
    setSummary({ revisados: 0, acertos: 0, lapsos: 0, dominados: 0, xp: 0 });
  }, []);

  const current = queue[cursor] ?? null;

  const progress = useMemo(
    () => ({ atual: Math.min(cursor + 1, queue.length), total: queue.length }),
    [cursor, queue.length],
  );

  return {
    start,
    reset,
    review,
    current,
    progress,
    progressPercent: queue.length === 0 ? 0 : Math.round((Math.min(cursor, queue.length) / queue.length) * 100),
    started,
    loading,
    reviewing,
    lastResult,
    summary,
    finished: started && queue.length > 0 && cursor >= queue.length,
    empty: started && queue.length === 0,
  };
};

/** Estado SRS que o cartao mostra antes da revisao (novo = valores iniciais do banco). */
export const currentProgressOf = (card: DueFlashcard): FlashcardProgressState => ({
  easeFactor: card.ease_factor ?? INITIAL_PROGRESS.easeFactor,
  intervalDays: card.interval_days ?? 0,
  repetitions: card.repetitions ?? 0,
  lapses: INITIAL_PROGRESS.lapses,
});

export interface AdminFlashcard {
  id: string;
  course_id: string;
  lesson_id: string | null;
  front: string;
  back: string;
  hint: string | null;
  is_active: boolean;
  course_title: string;
}

export interface FlashcardFormInput {
  id?: string;
  course_id: string;
  lesson_id: string | null;
  front: string;
  back: string;
  hint: string | null;
  is_active: boolean;
  created_by?: string | null;
}

type RawAdminFlashcard = Omit<AdminFlashcard, 'course_title'> & {
  courses: { title: string } | null;
};

/** Lista administrativa: inclui cartoes inativos e o titulo do curso. */
export const useAdminFlashcards = (courseId: string | null) =>
  useQuery({
    queryKey: ['flashcards', 'admin', courseId],
    queryFn: async (): Promise<AdminFlashcard[]> => {
      let query = supabase
        .from('flashcards')
        .select('id, course_id, lesson_id, front, back, hint, is_active, courses(title)')
        .order('created_at', { ascending: false });
      if (courseId) query = query.eq('course_id', courseId);

      const { data, error } = await query;
      if (error) throw error;

      return ((data ?? []) as unknown as RawAdminFlashcard[]).map((row) => ({
        id: row.id,
        course_id: row.course_id,
        lesson_id: row.lesson_id,
        front: row.front,
        back: row.back,
        hint: row.hint,
        is_active: row.is_active,
        course_title: row.courses?.title ?? 'Curso removido',
      }));
    },
  });

export const useSaveFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FlashcardFormInput) => {
      const payload = {
        course_id: input.course_id,
        lesson_id: input.lesson_id,
        front: input.front.trim(),
        back: input.back.trim(),
        hint: input.hint?.trim() ? input.hint.trim() : null,
        is_active: input.is_active,
      };

      if (input.id) {
        const { error } = await supabase.from('flashcards').update(payload).eq('id', input.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from('flashcards')
        .insert({ ...payload, created_by: input.created_by ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard salvo');
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível salvar o flashcard'),
  });
};

export const useToggleFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('flashcards').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Disponibilidade do flashcard atualizada');
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível atualizar o flashcard'),
  });
};

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flashcards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard removido');
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível remover o flashcard'),
  });
};