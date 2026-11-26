import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LessonForm } from './LessonForm';
import { QuizManager } from './QuizManager';
import { Plus, Edit, Trash2, Loader2, Clock, GripVertical, Play, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import type { Aula, CursoMinimo } from '@/types';


interface LessonsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CursoMinimo | null;
}

export function LessonsManager({ open, onOpenChange, course }: LessonsManagerProps) {
  const [lessons, setLessons] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Aula | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Aula | null>(null);
    const [savingDeletion, setSavingDeletion] = useState(false);
  const [quizManagerOpen, setQuizManagerOpen] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null);

  const fetchLessons = async () => {
    if (!course) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('order_index');

    if (error) {
      toast.error('Erro ao carregar aulas');
    } else {
      setLessons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && course) {
      fetchLessons();
    }
  }, [open, course]);

  const handleDeleteLesson = async () => {
      if (!deletingLesson || !course || savingDeletion) return;

      setSavingDeletion(true);
      try {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', deletingLesson.id);

        if (error) {
          toast.error('Erro ao excluir aula');
        } else {
          toast.success('Aula excluída com sucesso!');

          // Update course total_lessons count
          await supabase
            .from('courses')
            .update({ total_lessons: lessons.length - 1 })
            .eq('id', course.id);

          fetchLessons();
        }

        setDeletingLesson(null);
      } finally {
        setSavingDeletion(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}min`;
    }
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  if (!course) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Aulas do Curso: {course.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingLesson(null);
                  setLessonFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Aula
              </Button>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-24 text-center">Duração</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-24 text-center">Quiz</TableHead>
                    <TableHead className="w-24 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : lessons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma aula cadastrada. Clique em "Nova Aula" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{lesson.order_index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {lesson.is_free ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                              Gratuita
                            </Badge>
                          ) : (
                            <Badge variant="outline">Premium</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuizLessonId(lesson.id);
                              setQuizManagerOpen(true);
                            }}
                            className="gap-1"
                          >
                            <FileQuestion className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <IconTooltip label="Editar aula"><Button
                              variant="ghost"
                              size="icon" aria-label="Editar aula"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingLesson(lesson);
                                setLessonFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button></IconTooltip>
                            <IconTooltip label="Excluir aula"><Button
                              variant="ghost"
                              size="icon" aria-label="Excluir aula"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingLesson(lesson)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button></IconTooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LessonForm
        open={lessonFormOpen}
        onOpenChange={setLessonFormOpen}
        courseId={course.id}
        lesson={editingLesson}
        nextOrderIndex={lessons.length}
        onSuccess={fetchLessons}
      />

      {/* Quiz Manager Dialog */}
      <Dialog open={quizManagerOpen} onOpenChange={setQuizManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {quizLessonId && (
            <QuizManager 
              lessonId={quizLessonId} 
              onClose={() => setQuizManagerOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLesson} onOpenChange={() => setDeletingLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a aula "{deletingLesson?.title}"? 
              Esta ação não pode ser desfeita e o progresso dos usuários nesta aula será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
                          disabled={savingDeletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                          {savingDeletion ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
