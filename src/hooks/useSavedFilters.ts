import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedFilter {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateFilterInput {
  name: string;
  description?: string;
  filters: Record<string, any>;
  is_default?: boolean;
  is_public?: boolean;
}

/**
 * Hook para gerenciar filtros salvos
 * 
 * Features:
 * - Listar filtros (próprios + públicos)
 * - Salvar novo filtro
 * - Atualizar filtro existente
 * - Deletar filtro
 * - Definir filtro padrão
 * - Duplicar filtro
 * 
 * @param entityType - Tipo de entidade (ex: 'courses', 'learning_paths')
 * @returns Objeto com filtros e métodos de manipulação
 * 
 * @example
 * const {
 *   filters,
 *   isLoading,
 *   saveFilter,
 *   deleteFilter,
 *   setDefault
 * } = useSavedFilters('courses');
 * 
 * // Salvar filtro atual
 * saveFilter({
 *   name: 'Cursos Ativos',
 *   filters: { status: 'published', category: 'tech' }
 * });
 */
export function useSavedFilters(entityType: string) {
  const queryClient = useQueryClient();

  // Listar filtros (próprios + públicos)
  const { data: filters, isLoading, error } = useQuery({
    queryKey: ['saved-filters', entityType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar filtros próprios E públicos
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('entity_type', entityType)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedFilter[];
    },
  });

  // Buscar filtro padrão
  const defaultFilter = filters?.find(f => f.is_default);

  // Salvar novo filtro
  const saveMutation = useMutation({
    mutationFn: async (input: CreateFilterInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          ...input,
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um filtro com este nome');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success(`Filtro "${data.name}" salvo com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar filtro');
    },
  });

  // Atualizar filtro existente
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateFilterInput> }) => {
      const { data, error } = await supabase
        .from('saved_filters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success(`Filtro "${data.name}" atualizado!`);
    },
    onError: () => {
      toast.error('Erro ao atualizar filtro');
    },
  });

  // Deletar filtro
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filtro removido');
    },
    onError: () => {
      toast.error('Erro ao remover filtro');
    },
  });

  // Definir como padrão
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      // Remove default de todos do mesmo tipo
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('entity_type', entityType)
        .eq('user_id', user.id);
      
      // Define novo default
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filtro padrão definido');
    },
    onError: () => {
      toast.error('Erro ao definir filtro padrão');
    },
  });

  // Duplicar filtro
  const duplicateMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const filter = filters?.find(f => f.id === filterId);
      if (!filter) throw new Error('Filtro não encontrado');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          name: `${filter.name} (cópia)`,
          description: filter.description,
          filters: filter.filters,
          is_default: false,
          is_public: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success(`Filtro "${data.name}" duplicado!`);
    },
    onError: () => {
      toast.error('Erro ao duplicar filtro');
    },
  });

  return {
    filters: filters ?? [],
    defaultFilter,
    isLoading,
    error,
    saveFilter: saveMutation.mutate,
    updateFilter: updateMutation.mutate,
    deleteFilter: deleteMutation.mutate,
    setDefault: setDefaultMutation.mutate,
    duplicateFilter: duplicateMutation.mutate,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
