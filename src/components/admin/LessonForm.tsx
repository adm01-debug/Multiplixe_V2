import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { CHAPTERS_MAX, CHAPTER_TITLE_MAX, formatChapterTime, parseChapters, type LessonChapter } from '@/lib/chapters';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

const lessonSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  duration_seconds: z.number().min(0).optional(),
  order_index: z.number().min(0),
  is_free: z.boolean(),
  transcript: z.string().max(200000, 'Transcrição muito longa').optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_free: boolean;
  course_id: string;
  chapters?: unknown;
  transcript?: string | null;
}

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lesson?: Lesson | null;
  nextOrderIndex?: number;
  onSuccess: () => void;
}

export function LessonForm({ open, onOpenChange, courseId, lesson, nextOrderIndex = 0, onSuccess }: LessonFormProps) {
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<LessonChapter[]>([]);
  const { t } = useT();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      video_url: '',
      duration_seconds: 0,
      order_index: nextOrderIndex,
      is_free: false,
      transcript: '',
    },
  });

  const isFree = watch('is_free');
  const duracao = watch('duration_seconds');
  const capituloForaDoVideo = typeof duracao === 'number' && duracao > 0 && chapters.some((c) => c.start_seconds > duracao);
  // dois capitulos no mesmo segundo: a normalizacao grava so o primeiro, entao o salvamento e bloqueado
  const iniciosRepetidos = useMemo(() => {
    const vistos = new Set<number>();
    const repetidos = new Set<number>();
    for (const capitulo of chapters) {
      const segundo = Math.max(0, Math.floor(capitulo.start_seconds));
      if (vistos.has(segundo)) repetidos.add(segundo);
      else vistos.add(segundo);
    }
    return repetidos;
  }, [chapters]);

  useEffect(() => {
    if (lesson) {
      reset({
        title: lesson.title,
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        duration_seconds: lesson.duration_seconds || 0,
        order_index: lesson.order_index,
        is_free: lesson.is_free || false,
        transcript: lesson.transcript || '',
      });
      setChapters(parseChapters(lesson.chapters));
    } else {
      reset({
        title: '',
        description: '',
        video_url: '',
        duration_seconds: 0,
        order_index: nextOrderIndex,
        is_free: false,
        transcript: '',
      });
      setChapters([]);
    }
  }, [lesson, nextOrderIndex, reset]);

  const onSubmit = async (data: LessonFormData) => {
    if (iniciosRepetidos.size > 0) {
      toast.error(t('chapters.duplicateStart'));
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const lessonData = {
        course_id: courseId,
        title: data.title,
        description: data.description || null,
        video_url: data.video_url || null,
        duration_seconds: data.duration_seconds || 0,
        order_index: data.order_index,
        is_free: data.is_free,
        chapters: parseChapters(chapters) as unknown as Json,
        transcript: data.transcript?.trim() ? data.transcript : null,
      };

      if (lesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lesson.id);

        if (error) throw error;
        toast.success('Aula atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);

        if (error) throw error;
        toast.success('Aula criada com sucesso!');
      }

      // Update course total_lessons count
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      await supabase
        .from('courses')
        .update({ total_lessons: count || 0 })
        .eq('id', courseId);

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar aula';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Introdução ao atendimento"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva a aula..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">{t('transcript.adminTitle')}</Label>
            <Textarea
              id="transcript"
              {...register('transcript')}
              placeholder="00:00 Primeiro trecho da aula..."
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">{t('transcript.adminHint')}</p>
            {errors.transcript && (
              <p className="text-sm text-destructive">{errors.transcript.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">URL do Vídeo</Label>
            <Input
              id="video_url"
              {...register('video_url')}
              placeholder="https://..."
            />
            {errors.video_url && (
              <p className="text-sm text-destructive">{errors.video_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_seconds">Duração (segundos)</Label>
              <Input
                id="duration_seconds"
                type="number"
                {...register('duration_seconds', { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Ordem</Label>
              <Input
                id="order_index"
                type="number"
                {...register('order_index', { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Label>{t('chapters.adminTitle')}</Label>
                <p className="text-xs text-muted-foreground">{t('chapters.adminEmpty')}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                disabled={chapters.length >= CHAPTERS_MAX}
                onClick={() => setChapters((atuais) => [...atuais, { title: '', start_seconds: 0 }])}
              >
                <Plus className="h-4 w-4" />
                {t('chapters.add')}
              </Button>
            </div>

            {chapters.length > 0 && (
              <div className="space-y-2">
                {chapters.map((capitulo, indice) => (
                  <div key={indice} className="flex items-center gap-2">
                    <Input
                      value={capitulo.title}
                      maxLength={CHAPTER_TITLE_MAX}
                      placeholder={t('chapters.namePlaceholder')}
                      aria-label={t('chapters.namePlaceholder')}
                      className={capitulo.title.trim() ? '' : 'border-destructive'}
                      onChange={(e) => setChapters((atuais) => atuais.map((c, i) => (i === indice ? { ...c, title: e.target.value } : c)))}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={capitulo.start_seconds}
                      aria-label={t('chapters.startLabel')}
                      className={iniciosRepetidos.has(capitulo.start_seconds) ? 'w-24 border-destructive' : 'w-24'}
                      onChange={(e) => setChapters((atuais) => atuais.map((c, i) => (i === indice ? { ...c, start_seconds: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : c)))}
                    />
                    <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">{formatChapterTime(capitulo.start_seconds)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('chapters.remove')}
                      onClick={() => setChapters((atuais) => atuais.filter((_, i) => i !== indice))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {iniciosRepetidos.size > 0 && <p className="text-xs text-destructive">{t('chapters.duplicateStart')}</p>}
            {capituloForaDoVideo && <p className="text-xs text-amber-600">{t('chapters.afterEnd')}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_free"
              checked={isFree}
              onCheckedChange={(checked) => setValue('is_free', checked)}
            />
            <Label htmlFor="is_free" className="cursor-pointer">
              Aula gratuita (disponível para preview)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {lesson ? 'Salvar Alterações' : 'Criar Aula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
