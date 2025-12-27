import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';
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
}

interface LearningPathFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningPath: LearningPath | null;
  onSuccess: () => void;
}

export function LearningPathForm({ open, onOpenChange, learningPath, onSuccess }: LearningPathFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    thumbnail_url: '',
    estimated_hours: 0,
    difficulty_level: 'iniciante',
    xp_reward: 500,
  });

  useEffect(() => {
    if (learningPath) {
      setFormData({
        title: learningPath.title,
        slug: learningPath.slug,
        description: learningPath.description || '',
        thumbnail_url: learningPath.thumbnail_url || '',
        estimated_hours: learningPath.estimated_hours,
        difficulty_level: learningPath.difficulty_level,
        xp_reward: learningPath.xp_reward,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        thumbnail_url: '',
        estimated_hours: 0,
        difficulty_level: 'iniciante',
        xp_reward: 500,
      });
    }
  }, [learningPath, open]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: learningPath ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('O slug é obrigatório');
      return;
    }

    setLoading(true);

    try {
      if (learningPath) {
        // Update
        const { error } = await supabase
          .from('learning_paths')
          .update({
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            thumbnail_url: formData.thumbnail_url.trim() || null,
            estimated_hours: formData.estimated_hours,
            difficulty_level: formData.difficulty_level,
            xp_reward: formData.xp_reward,
          })
          .eq('id', learningPath.id);

        if (error) throw error;
        toast.success('Trilha atualizada com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('learning_paths')
          .insert({
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            thumbnail_url: formData.thumbnail_url.trim() || null,
            estimated_hours: formData.estimated_hours,
            difficulty_level: formData.difficulty_level,
            xp_reward: formData.xp_reward,
          });

        if (error) throw error;
        toast.success('Trilha criada com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving learning path:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma trilha com este slug');
      } else {
        toast.error('Erro ao salvar trilha');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {learningPath ? 'Editar Trilha' : 'Nova Trilha de Aprendizado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Full Stack Developer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="full-stack-developer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o que o aluno vai aprender nesta trilha..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL da Imagem</Label>
            <Input
              id="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Nível de Dificuldade</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                min={0}
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="xp_reward">XP de Bônus (conclusão)</Label>
            <Input
              id="xp_reward"
              type="number"
              min={0}
              value={formData.xp_reward}
              onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {learningPath ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
