import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CourseForm } from '@/components/admin/CourseForm';
import { LessonsManager } from '@/components/admin/LessonsManager';
import { Search, Loader2, Clock, Eye, Edit, Trash2, Plus, Play } from 'lucide-react';
import { toast } from 'sonner';

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  is_featured: boolean;
  level: string;
  total_lessons: number;
  duration_minutes: number;
  created_at: string;
  instructor_name: string | null;
  category_id: string | null;
}

interface Props {
  courses: AdminCourse[];
  setCourses: React.Dispatch<React.SetStateAction<AdminCourse[]>>;
  loadingData: boolean;
  onRefresh: () => void;
}

const AdminCoursesTab = ({ courses, setCourses, loadingData, onRefresh }: Props) => {
  const navigate = useNavigate();
  const [searchCourses, setSearchCourses] = useState('');
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null);
  const [lessonsManagerOpen, setLessonsManagerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);

  const filteredCourses = useFuzzySearch(courses, ["title", "description", "instructor_name"], searchCourses);

  const toggleCoursePublished = async (courseId: string, currentValue: boolean) => {
    const { error } = await supabase.from('courses').update({ is_published: !currentValue }).eq('id', courseId);
    if (error) {
      toast.error('Erro ao atualizar curso');
    } else {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: !currentValue } : c));
      toast.success(`Curso ${!currentValue ? 'publicado' : 'despublicado'}`);
    }
  };

  const toggleCourseFeatured = async (courseId: string, currentValue: boolean) => {
    const { error } = await supabase.from('courses').update({ is_featured: !currentValue }).eq('id', courseId);
    if (error) {
      toast.error('Erro ao atualizar curso');
    } else {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_featured: !currentValue } : c));
      toast.success(`Curso ${!currentValue ? 'destacado' : 'removido dos destaques'}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    const { error } = await supabase.from('courses').delete().eq('id', deletingCourse.id);
    if (error) {
      toast.error('Erro ao excluir curso');
    } else {
      toast.success('Curso excluído com sucesso!');
      setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
    }
    setDeletingCourse(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Buscar cursos" placeholder="Buscar cursos..." value={searchCourses} onChange={(e) => setSearchCourses(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => { setEditingCourse(null); setCourseFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Curso
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-center">Aulas</TableHead>
              <TableHead className="text-center">Duração</TableHead>
              <TableHead className="text-center">Publicado</TableHead>
              <TableHead className="text-center">Destaque</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingData ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum curso encontrado</TableCell></TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell><Badge variant="outline">{course.level}</Badge></TableCell>
                  <TableCell className="text-center">{course.total_lessons}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />{course.duration_minutes}min
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={course.is_published} onCheckedChange={() => toggleCoursePublished(course.id, course.is_published)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={course.is_featured} onCheckedChange={() => toggleCourseFeatured(course.id, course.is_featured)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/curso/${course.slug}`)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedCourse(course); setLessonsManagerOpen(true); }} title="Gerenciar aulas"><Play className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCourse(course); setCourseFormOpen(true); }} title="Editar"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingCourse(course)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CourseForm open={courseFormOpen} onOpenChange={setCourseFormOpen} course={editingCourse} onSuccess={onRefresh} />
      <LessonsManager open={lessonsManagerOpen} onOpenChange={setLessonsManagerOpen} course={selectedCourse} />

      <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso "{deletingCourse?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCoursesTab;
