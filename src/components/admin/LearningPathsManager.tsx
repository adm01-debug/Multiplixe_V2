import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { Button } from '@/components/ui/button';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { LearningPathForm } from './LearningPathForm';
import { LearningPathCoursesManager } from './LearningPathCoursesManager';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Loader2,
  BookOpen,
  Route
} from 'lucide-react';
import { toast } from 'sonner';

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  estimated_hours: number;
  difficulty_level: string;
  is_published: boolean;
  is_featured: boolean;
  xp_reward: number;
  created_at: string;
  courses_count?: number;
}

export function LearningPathsManager() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [deletingPath, setDeletingPath] = useState<LearningPath | null>(null);
  const [savingDeletion, setSavingDeletion] = useState(false);
  const [busyPathId, setBusyPathId] = useState<string | null>(null);
  const [coursesManagerOpen, setCoursesManagerOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  const fetchLearningPaths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get course counts
      const pathsWithCounts = await Promise.all(
        (data || []).map(async (path) => {
          const { count } = await supabase
            .from('learning_path_courses')
            .select('*', { count: 'exact', head: true })
            .eq('learning_path_id', path.id);

          return { ...path, courses_count: count || 0 };
        })
      );

      setLearningPaths(pathsWithCounts);
    } catch {
      toast.error('Erro ao carregar trilhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const togglePublished = async (pathId: string, currentValue: boolean) => {
      if (busyPathId) return;
      setBusyPathId(pathId);
      try {
        const { error } = await supabase
          .from('learning_paths')
          .update({ is_published: !currentValue })
          .eq('id', pathId);

        if (error) {
          toast.error('Erro ao atualizar trilha');
        } else {
          setLearningPaths(prev =>
            prev.map(p => p.id === pathId ? { ...p, is_published: !currentValue } : p)
          );
          toast.success(`Trilha ${!currentValue ? 'publicada' : 'despublicada'}`);
        }
      } finally {
        setBusyPathId(null);
    }
  };

  const toggleFeatured = async (pathId: string, currentValue: boolean) => {
      if (busyPathId) return;
      setBusyPathId(pathId);
      try {
        const { error } = await supabase
          .from('learning_paths')
          .update({ is_featured: !currentValue })
          .eq('id', pathId);

        if (error) {
          toast.error('Erro ao atualizar trilha');
        } else {
          setLearningPaths(prev =>
            prev.map(p => p.id === pathId ? { ...p, is_featured: !currentValue } : p)
          );
          toast.success(`Trilha ${!currentValue ? 'destacada' : 'removida dos destaques'}`);
        }
      } finally {
        setBusyPathId(null);
    }
  };

  const handleDelete = async () => {
      if (!deletingPath || savingDeletion) return;

      setSavingDeletion(true);
      try {
        const { error } = await supabase
          .from('learning_paths')
          .delete()
          .eq('id', deletingPath.id);

        if (error) {
          toast.error('Erro ao excluir trilha');
        } else {
          toast.success('Trilha excluída com sucesso!');
          setLearningPaths(prev => prev.filter(p => p.id !== deletingPath.id));
        }

        setDeletingPath(null);
      } finally {
        setSavingDeletion(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPath(null);
    fetchLearningPaths();
  };

  // Fuzzy search com Fuse.js
  const filteredPaths = useFuzzySearch(
    learningPaths,
    ["title", "description", "difficulty_level"],
    search
  );

  const levelLabels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Buscar trilhas"
            placeholder="Buscar trilhas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setEditingPath(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Trilha
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trilha</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-center">Cursos</TableHead>
              <TableHead className="text-center">Duração</TableHead>
              <TableHead className="text-center">XP</TableHead>
              <TableHead className="text-center">Publicada</TableHead>
              <TableHead className="text-center">Destaque</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredPaths.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma trilha encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredPaths.map((path) => (
                <TableRow key={path.id}>
                  <TableCell className="font-medium">{path.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {levelLabels[path.difficulty_level] || path.difficulty_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {path.courses_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {path.estimated_hours}h
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{path.xp_reward} XP</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={path.is_published}
                                          disabled={busyPathId === path.id}
                      onCheckedChange={() => togglePublished(path.id, path.is_published)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={path.is_featured}
                                          disabled={busyPathId === path.id}
                      onCheckedChange={() => toggleFeatured(path.id, path.is_featured)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <IconTooltip label="Visualizar"><Button aria-label={"Visualizar"}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(`/trilha/${path.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button></IconTooltip>
                      <IconTooltip label="Gerenciar cursos"><Button aria-label={"Gerenciar cursos"}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedPath(path);
                          setCoursesManagerOpen(true);
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button></IconTooltip>
                      <IconTooltip label="Editar"><Button aria-label={"Editar"}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPath(path);
                          setFormOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button></IconTooltip>
                      <IconTooltip label="Excluir"><Button aria-label={"Excluir"}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingPath(path)}
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

      {/* Learning Path Form Modal */}
      <LearningPathForm
        open={formOpen}
        onOpenChange={setFormOpen}
        learningPath={editingPath}
        onSuccess={handleFormSuccess}
      />

      {/* Courses Manager Modal */}
      {selectedPath && (
        <LearningPathCoursesManager
          open={coursesManagerOpen}
          onOpenChange={setCoursesManagerOpen}
          learningPath={selectedPath}
          onSuccess={fetchLearningPaths}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPath} onOpenChange={() => setDeletingPath(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir trilha?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a trilha "{deletingPath?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
                          disabled={savingDeletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                          {savingDeletion ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
