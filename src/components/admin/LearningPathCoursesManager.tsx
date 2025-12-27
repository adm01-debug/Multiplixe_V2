import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Loader2, 
  BookOpen,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { toast } from 'sonner';

interface LearningPath {
  id: string;
  title: string;
  slug: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  total_lessons: number;
}

interface PathCourse {
  id: string;
  course_id: string;
  order_index: number;
  course: Course;
}

interface LearningPathCoursesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningPath: LearningPath;
  onSuccess: () => void;
}

export function LearningPathCoursesManager({
  open,
  onOpenChange,
  learningPath,
  onSuccess,
}: LearningPathCoursesManagerProps) {
  const [pathCourses, setPathCourses] = useState<PathCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courses in this learning path
      const { data: pathCoursesData, error: pathError } = await supabase
        .from('learning_path_courses')
        .select(`
          id,
          course_id,
          order_index,
          course:courses (
            id,
            title,
            slug,
            duration_minutes,
            total_lessons
          )
        `)
        .eq('learning_path_id', learningPath.id)
        .order('order_index', { ascending: true });

      if (pathError) throw pathError;

      const formattedCourses = (pathCoursesData || []).map((pc: any) => ({
        id: pc.id,
        course_id: pc.course_id,
        order_index: pc.order_index,
        course: pc.course,
      }));
      setPathCourses(formattedCourses);

      // Fetch all published courses
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug, duration_minutes, total_lessons')
        .eq('is_published', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Filter out courses already in the path
      const pathCourseIds = formattedCourses.map((pc: PathCourse) => pc.course_id);
      const available = (allCourses || []).filter(c => !pathCourseIds.includes(c.id));
      setAvailableCourses(available);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, learningPath.id]);

  const addCourse = async () => {
    if (!selectedCourseId) {
      toast.error('Selecione um curso');
      return;
    }

    setSaving(true);
    try {
      const newOrderIndex = pathCourses.length;

      const { error } = await supabase
        .from('learning_path_courses')
        .insert({
          learning_path_id: learningPath.id,
          course_id: selectedCourseId,
          order_index: newOrderIndex,
        });

      if (error) throw error;

      toast.success('Curso adicionado à trilha');
      setSelectedCourseId('');
      fetchData();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding course:', error);
      if (error.code === '23505') {
        toast.error('Este curso já está na trilha');
      } else {
        toast.error('Erro ao adicionar curso');
      }
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (pathCourseId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('learning_path_courses')
        .delete()
        .eq('id', pathCourseId);

      if (error) throw error;

      toast.success('Curso removido da trilha');
      fetchData();
      onSuccess();
    } catch (error) {
      console.error('Error removing course:', error);
      toast.error('Erro ao remover curso');
    } finally {
      setSaving(false);
    }
  };

  const moveCourse = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pathCourses.length) return;

    setSaving(true);
    try {
      const course1 = pathCourses[index];
      const course2 = pathCourses[newIndex];

      // Swap order indices
      await Promise.all([
        supabase
          .from('learning_path_courses')
          .update({ order_index: newIndex })
          .eq('id', course1.id),
        supabase
          .from('learning_path_courses')
          .update({ order_index: index })
          .eq('id', course2.id),
      ]);

      fetchData();
    } catch (error) {
      console.error('Error reordering courses:', error);
      toast.error('Erro ao reordenar cursos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Cursos da Trilha: {learningPath.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Course Section */}
          <div className="flex gap-2">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um curso para adicionar..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum curso disponível
                  </SelectItem>
                ) : (
                  availableCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={addCourse} disabled={saving || !selectedCourseId}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* Course List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pathCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum curso adicionado à trilha.</p>
              <p className="text-sm">Adicione cursos para criar a sequência de aprendizado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pathCourses.map((pc, index) => (
                <Card key={pc.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="w-6 text-center font-bold">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{pc.course.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{pc.course.total_lessons} aulas</span>
                          <span>{Math.round(pc.course.duration_minutes / 60)}h</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveCourse(index, 'up')}
                          disabled={index === 0 || saving}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveCourse(index, 'down')}
                          disabled={index === pathCourses.length - 1 || saving}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeCourse(pc.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Os cursos serão desbloqueados na ordem definida acima.
            O aluno só poderá acessar o próximo curso após concluir o anterior.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
