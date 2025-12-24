import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const courseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  slug: z.string().min(1, 'Slug é obrigatório').max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().max(2000).optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado']),
  instructor_name: z.string().max(100).optional(),
  duration_minutes: z.number().min(0).optional(),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  category_id: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: string;
  instructor_name: string | null;
  duration_minutes: number;
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
}

interface CourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSuccess: () => void;
}

export function CourseForm({ open, onOpenChange, course, onSuccess }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      level: 'iniciante',
      instructor_name: '',
      duration_minutes: 0,
      is_published: false,
      is_featured: false,
      category_id: '',
    },
  });

  const isPublished = watch('is_published');
  const isFeatured = watch('is_featured');

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        level: course.level as 'iniciante' | 'intermediario' | 'avancado',
        instructor_name: course.instructor_name || '',
        duration_minutes: course.duration_minutes || 0,
        is_published: course.is_published,
        is_featured: course.is_featured,
        category_id: course.category_id || '',
      });
    } else {
      reset({
        title: '',
        slug: '',
        description: '',
        level: 'iniciante',
        instructor_name: '',
        duration_minutes: 0,
        is_published: false,
        is_featured: false,
        category_id: '',
      });
    }
  }, [course, reset]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);

    try {
      const courseData = {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        level: data.level,
        instructor_name: data.instructor_name || null,
        duration_minutes: data.duration_minutes || 0,
        is_published: data.is_published,
        is_featured: data.is_featured,
        category_id: data.category_id || null,
      };

      if (course) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;
        toast.success('Curso atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert(courseData);

        if (error) throw error;
        toast.success('Curso criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Erro ao salvar curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title')}
                onChange={(e) => {
                  register('title').onChange(e);
                  if (!course) {
                    setValue('slug', generateSlug(e.target.value));
                  }
                }}
                placeholder="Ex: Atendimento ao Cliente"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="ex: atendimento-ao-cliente"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o curso..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Nível *</Label>
              <Select
                value={watch('level')}
                onValueChange={(value) => setValue('level', value as 'iniciante' | 'intermediario' | 'avancado')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">🌱 Iniciante</SelectItem>
                  <SelectItem value="intermediario">🚀 Intermediário</SelectItem>
                  <SelectItem value="avancado">⚡ Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Select
                value={watch('category_id') || ''}
                onValueChange={(value) => setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (min)</Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register('duration_minutes', { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor_name">Nome do Instrutor</Label>
            <Input
              id="instructor_name"
              {...register('instructor_name')}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={(checked) => setValue('is_published', checked)}
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                Publicado
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_featured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue('is_featured', checked)}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Destaque
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {course ? 'Salvar Alterações' : 'Criar Curso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
