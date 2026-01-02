import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BuscaFulltextOptions {
  enabled?: boolean;
  minLength?: number;
}

/**
 * Hook para busca fulltext otimizada
 * Busca em múltiplas colunas usando ILIKE (case-insensitive)
 * 
 * @param tabela - Nome da tabela no Supabase
 * @param searchTerm - Termo de busca
 * @param colunas - Array de colunas para buscar (default: ['*'])
 * @param options - Opções adicionais (enabled, minLength)
 * @returns Query result com dados, loading, error
 * 
 * @example
 * const { data: cursos, isLoading } = useBuscaFulltext(
 *   'courses',
 *   searchTerm,
 *   ['title', 'description', 'instructor'],
 *   { minLength: 2 }
 * );
 */
export function useBuscaFulltext<T>(
  tabela: string,
  searchTerm: string,
  colunas: string[] = ['*'],
  options: BuscaFulltextOptions = {}
) {
  const { 
    enabled = true, 
    minLength = 2 
  } = options;

  return useQuery({
    queryKey: ['fulltext', tabela, searchTerm, colunas],
    queryFn: async () => {
      // Se searchTerm estiver vazio, retornar todos os registros
      if (!searchTerm.trim()) {
        const { data, error } = await supabase
          .from(tabela)
          .select(colunas.join(','))
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        return data as T[];
      }

      // Busca fulltext usando OR em múltiplas colunas
      const searchPattern = `%${searchTerm}%`;
      const colunasParaBusca = colunas.filter(col => col !== '*');
      
      let query = supabase.from(tabela).select(colunas.join(','));
      
      if (colunasParaBusca.length > 0) {
        // Criar condição OR para cada coluna
        const orCondition = colunasParaBusca
          .map(col => `${col}.ilike.${searchPattern}`)
          .join(',');
        
        query = query.or(orCondition);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as T[];
    },
    enabled: enabled && searchTerm.length >= minLength,
    // Cache por 5 minutos
    staleTime: 5 * 60 * 1000,
  });
}
