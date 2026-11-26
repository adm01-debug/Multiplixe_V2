import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, EyeOff, Brain } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import {
  useAdminFlashcards,
  useDeleteFlashcard,
  useSaveFlashcard,
  useToggleFlashcard,
  type FlashcardFormInput,
} from '@/hooks/useFlashcards';
import { useCourses } from '@/hooks/useCachedQuery';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ALL_COURSES = 'todos';

interface LessonOption {
  id: string;
  title: string;
  order_index: number | null;
}

const emptyForm = (courseId: string): FlashcardFormInput => ({
  course_id: courseId,
  lesson_id: null,
  front: '',
  back: '',
  hint: null,
  is_active: true,
});

const AdminFlashcardsTab = () => {
  const { user } = useAuth();
  const { data: courses = [] } = useCourses();
  const [courseFilter, setCourseFilter] = useState<string>(ALL_COURSES);
  const { data: cards = [], isLoading } = useAdminFlashcards(
    courseFilter === ALL_COURSES ? null : courseFilter,
  );
  const save = useSaveFlashcard();
  const toggle = useToggleFlashcard();
  const del = useDeleteFlashcard();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FlashcardFormInput>(emptyForm(''));
  const [lessons, setLessons] = useState<LessonOption[]>([]);

  useEffect(() => {
    if (!form.course_id) {
      setLessons([]);
      return;
    }
    let active = true;
    supabase
      .from('lessons')
      .select('id, title, order_index')
      .eq('course_id', form.course_id)
      .order('order_index')
      .then(({ data }) => {
        if (active) setLessons((data ?? []) as LessonOption[]);
      });
    return () => {
      active = false;
    };
  }, [form.course_id]);

  const stats = useMemo(() => {
    const ativos = cards.filter((c) => c.is_active).length;
    return { total: cards.length, ativos, inativos: cards.length - ativos };
  }, [cards]);

  const openNew = () => {
    const seedCourse = courseFilter !== ALL_COURSES ? courseFilter : courses[0]?.id ?? '';
    setForm(emptyForm(seedCourse));
    setOpen(true);
  };

  const openEdit = (card: (typeof cards)[number]) => {
    setForm({
      id: card.id,
      course_id: card.course_id,
      lesson_id: card.lesson_id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      is_active: card.is_active,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.course_id) {
      toast.error('Selecione o curso do flashcard');
      return;
    }
    if (!form.front.trim()) {
      toast.error('Escreva a frente do cartao');
      return;
    }
    if (!form.back.trim()) {
      toast.error('Escreva o verso do cartao');
      return;
    }
    save.mutate(
      {
        ...form,
        front: form.front.trim(),
        back: form.back.trim(),
        hint: form.hint?.trim() ? form.hint.trim() : null,
        created_by: user?.id ?? null,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Flashcards de revisao</h3>
          <p className="text-xs text-muted-foreground">
            {stats.total} cartoes · {stats.ativos} ativos · {stats.inativos} inativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[240px]" aria-label="Filtrar flashcards por curso">
              <SelectValue placeholder="Todos os cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COURSES}>Todos os cursos</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Novo Flashcard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : cards.length === 0 ? (
        <SimpleEmptyState
          icon={Brain}
          title="Nenhum flashcard cadastrado"
          description="Crie cartoes de pergunta e resposta para os alunos revisarem com repeticao espacada."
        />
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{card.front}</h4>
                    {!card.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.back}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.course_title}
                    {card.hint ? ` · dica: ${card.hint}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconTooltip label={card.is_active ? 'Desativar cartao' : 'Ativar cartao'}>
                    <Button
                      size="icon"
                      aria-label={card.is_active ? 'Desativar cartao' : 'Ativar cartao'}
                      variant="ghost"
                      onClick={() => toggle.mutate({ id: card.id, is_active: !card.is_active })}
                    >
                      {card.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </IconTooltip>
                  <IconTooltip label="Editar cartao">
                    <Button
                      size="icon"
                      aria-label="Editar cartao"
                      variant="ghost"
                      onClick={() => openEdit(card)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </IconTooltip>
                  <IconTooltip label="Excluir cartao">
                    <Button
                      size="icon"
                      aria-label="Excluir cartao"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Excluir este flashcard? O progresso dos alunos neste cartao tambem sera removido.')) {
                          del.mutate(card.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </IconTooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar' : 'Novo'} Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="flashcard-course">Curso</Label>
              <Select
                value={form.course_id}
                onValueChange={(value) => setForm({ ...form, course_id: value, lesson_id: null })}
              >
                <SelectTrigger id="flashcard-course">
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="flashcard-lesson">Aula (opcional)</Label>
              <Select
                value={form.lesson_id ?? 'sem-aula'}
                onValueChange={(value) =>
                  setForm({ ...form, lesson_id: value === 'sem-aula' ? null : value })
                }
              >
                <SelectTrigger id="flashcard-lesson">
                  <SelectValue placeholder="Sem aula vinculada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-aula">Sem aula vinculada</SelectItem>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.order_index ?? '-'}. {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="flashcard-front">Frente (pergunta)</Label>
              <Textarea
                id="flashcard-front"
                rows={2}
                value={form.front}
                onChange={(e) => setForm({ ...form, front: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="flashcard-back">Verso (resposta)</Label>
              <Textarea
                id="flashcard-back"
                rows={3}
                value={form.back}
                onChange={(e) => setForm({ ...form, back: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="flashcard-hint">Dica (opcional)</Label>
              <Input
                id="flashcard-hint"
                value={form.hint ?? ''}
                onChange={(e) => setForm({ ...form, hint: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Disponivel para revisao dos alunos</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFlashcardsTab;