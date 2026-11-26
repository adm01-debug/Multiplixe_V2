import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourseForm } from '@/components/admin/CourseForm';
import { LessonsManager } from '@/components/admin/LessonsManager';
import CourseCsvImport from '@/components/admin/CourseCsvImport';
import { Search, Loader2, Clock, Eye, Edit, Trash2, Plus, Play, Tag, X, FileUp } from 'lucide-react';
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
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (active && data) setCategories(data as { id: string; name: string }[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = useFuzzySearch(courses, ["title", "description", "instructor_name"], searchCourses);

  const allFilteredSelected =
    filteredCourses.length > 0 && filteredCourses.every((course) => selectedIds.includes(course.id));

  const toggleSelected = (courseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? [] : filteredCourses.map((course) => course.id));
  };

  type BulkPatch = Partial<Pick<AdminCourse, 'is_published' | 'is_featured' | 'category_id'>>;

  const applyBulkUpdate = async (patch: BulkPatch, successMessage: string) => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('courses').update(patch).in('id', selectedIds);
    if (error) {
      toast.error('Erro ao atualizar cursos');
      return;
    }
    setCourses((prev) => prev.map((course) => (selectedIds.includes(course.id) ? { ...course, ...patch } : course)));
    setSelectedIds([]);
    toast.success(successMessage);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('courses').delete().in('id', selectedIds);
    if (error) {
      toast.error('Erro ao excluir cursos');
      return;
    }
    setCourses((prev) => prev.filter((course) => !selectedIds.includes(course.id)));
    toast.success(`${selectedIds.length} curso(s) excluido(s)`);
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

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
        <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
                    <FileUp className="h-4 w-4 mr-2" /> Importar CSV
                  </Button>
                  <Button onClick={() => { setEditingCourse(null); setCourseFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Curso
                  </Button>
                </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selectedIds.length} selecionado(s)</span>
          <Button size="sm" variant="outline" onClick={() => applyBulkUpdate({ is_published: true }, 'Cursos publicados')}>
            Publicar
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyBulkUpdate({ is_published: false }, 'Cursos despublicados')}>
            Despublicar
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyBulkUpdate({ is_featured: true }, 'Cursos destacados')}>
            Destacar
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyBulkUpdate({ is_featured: false }, 'Cursos removidos dos destaques')}>
            Remover destaque
          </Button>
          <div className="flex items-center gap-2">
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger className="h-9 w-48" aria-label="Categoria para aplicar em massa">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkCategoryId}
              onClick={() => applyBulkUpdate({ category_id: bulkCategoryId }, 'Categoria atribuida')}
            >
              <Tag className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
          </div>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" aria-label="Excluir cursos selecionados" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            <X className="h-4 w-4 mr-1" />
            Limpar selecao
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos os cursos"
                />
              </TableHead>
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
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum curso encontrado</TableCell></TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(course.id)}
                      onCheckedChange={() => toggleSelected(course.id)}
                      aria-label={`Selecionar ${course.title}`}
                    />
                  </TableCell>
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.length} curso(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove os cursos selecionados junto com aulas, quizzes e progresso ligados a eles. Nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedIds.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

            <CourseCsvImport
              open={csvImportOpen}
              onOpenChange={setCsvImportOpen}
              categories={categories}
              onImported={onRefresh}
            />
          </div>
  );
};

export default AdminCoursesTab;
