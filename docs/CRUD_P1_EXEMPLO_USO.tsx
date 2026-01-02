/**
 * EXEMPLO DE USO - MELHORIAS P1 NO MULTIPLIXE
 * 
 * Este arquivo demonstra como integrar:
 * 1. Busca Fulltext Avançada
 * 2. Filtros Salvos
 * 3. Import CSV
 * 
 * em uma página do MULTIPLIXE (ex: Admin de Cursos)
 */

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// IMPORTAR OS NOVOS COMPONENTES E HOOKS
// ============================================
import { BuscaAvancada } from '@/components/BuscaAvancada';
import { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
import { CSVImporter } from '@/components/CSVImporter';
import { useBuscaFulltext } from '@/hooks/useBuscaFulltext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// ============================================
// 1. DEFINIR SCHEMA ZOD PARA VALIDAÇÃO CSV
// ============================================
const cursoSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  instructor: z.string().min(1, 'Instrutor é obrigatório'),
  duration: z.coerce.number().positive('Duração deve ser positiva'),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Nível deve ser: beginner, intermediate ou advanced' })
  }),
  category: z.string().optional(),
  published: z.coerce.boolean().default(false),
});

type CursoImport = z.infer<typeof cursoSchema>;

// ============================================
// 2. PÁGINA DE ADMIN COM TODAS AS MELHORIAS
// ============================================
export function AdminCursosPage() {
  // Estado de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<Record<string, any>>({});
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Busca fulltext (P1)
  const { 
    data: cursosSearch, 
    isLoading: isSearching 
  } = useBuscaFulltext<any>(
    'courses',
    searchTerm,
    ['title', 'description', 'instructor'],
    { minLength: 2 }
  );

  // ============================================
  // 3. HANDLER PARA APLICAR FILTROS SALVOS
  // ============================================
  const handleApplyFilter = (savedFilters: Record<string, any>) => {
    setFiltros(savedFilters);
    // Aplicar filtros na query do Supabase
    // ... lógica de filtros
  };

  // ============================================
  // 4. HANDLER PARA IMPORT CSV
  // ============================================
  const handleImportCursos = async (cursos: CursoImport[]) => {
    try {
      const { error } = await supabase
        .from('courses')
        .insert(cursos.map(curso => ({
          ...curso,
          created_at: new Date().toISOString(),
        })));
      
      if (error) throw error;
      
      toast.success(`${cursos.length} cursos importados com sucesso!`);
      // Recarregar lista de cursos
    } catch (error) {
      console.error('Erro ao importar:', error);
      throw error;
    }
  };

  // ============================================
  // 5. RENDER COM TODOS OS COMPONENTES
  // ============================================
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
        
        <Button onClick={() => setShowImportDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </div>

      {/* ========================================== */}
      {/* BARRA DE FERRAMENTAS COM MELHORIAS P1 */}
      {/* ========================================== */}
      <div className="flex gap-4 items-start">
        {/* 1. BUSCA FULLTEXT AVANÇADA */}
        <div className="flex-1">
          <BuscaAvancada
            onSearch={setSearchTerm}
            placeholder="Buscar cursos por título, descrição ou instrutor..."
            isLoading={isSearching}
          />
        </div>

        {/* 2. FILTROS SALVOS */}
        <SavedFiltersDropdown
          entityType="courses"
          currentFilters={filtros}
          onApplyFilter={handleApplyFilter}
        />
      </div>

      {/* ========================================== */}
      {/* GRID DE CURSOS */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isSearching ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48 bg-muted" />
            </Card>
          ))
        ) : cursosSearch && cursosSearch.length > 0 ? (
          cursosSearch.map((curso) => (
            <Card key={curso.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{curso.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {curso.instructor}
                </p>
                {/* ... mais detalhes */}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Nenhum curso encontrado com esse termo' 
                : 'Nenhum curso cadastrado'
              }
            </p>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 3. DIALOG DE IMPORT CSV */}
      {/* ========================================== */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Cursos via CSV</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV com os cursos para importação em massa
            </DialogDescription>
          </DialogHeader>

          <CSVImporter
            schema={cursoSchema}
            onImport={handleImportCursos}
            entityName="cursos"
            exampleData={[
              {
                title: 'Introdução ao React',
                description: 'Aprenda React do zero com exemplos práticos',
                instructor: 'João Silva',
                duration: 120,
                level: 'beginner',
                category: 'Tecnologia',
                published: true,
              },
              {
                title: 'Python Avançado',
                description: 'Conceitos avançados de Python para desenvolvedores',
                instructor: 'Maria Santos',
                duration: 180,
                level: 'advanced',
                category: 'Programação',
                published: false,
              },
            ]}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 6. EXEMPLO DE INTEGRAÇÃO NO CATÁLOGO
// ============================================
export function CatalogoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({});

  const { 
    data: cursos, 
    isLoading 
  } = useBuscaFulltext<any>(
    'courses',
    searchTerm,
    ['title', 'description', 'instructor'],
    { minLength: 2 }
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Cursos</h1>

      {/* Busca + Filtros */}
      <div className="flex gap-4 mb-6">
        <BuscaAvancada
          onSearch={setSearchTerm}
          placeholder="Buscar cursos..."
          isLoading={isLoading}
          className="flex-1"
        />

        <SavedFiltersDropdown
          entityType="courses"
          currentFilters={filtros}
          onApplyFilter={setFiltros}
        />
      </div>

      {/* Grid de Cursos */}
      {/* ... implementação */}
    </div>
  );
}

// ============================================
// 7. SCHEMA DE EXEMPLO PARA OUTROS IMPORTS
// ============================================

// Exemplo: Import de Usuários
const usuarioSchema = z.object({
  full_name: z.string().min(1, 'Nome completo obrigatório'),
  email: z.string().email('Email inválido'),
  department: z.string().optional(),
  role: z.enum(['admin', 'student', 'instructor']).default('student'),
});

// Exemplo: Import de Aulas
const aulaSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  course_id: z.string().uuid('ID do curso inválido'),
  video_url: z.string().url('URL do vídeo inválida'),
  duration: z.coerce.number().positive('Duração inválida'),
  order_index: z.coerce.number().int().nonnegative('Ordem inválida'),
  description: z.string().optional(),
});

// Exemplo: Import de Quizzes
const quizSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  course_id: z.string().uuid('ID do curso inválido'),
  passing_score: z.coerce.number().min(0).max(100, 'Score deve estar entre 0 e 100'),
  max_attempts: z.coerce.number().int().positive('Tentativas deve ser positivo').optional(),
  time_limit: z.coerce.number().int().positive('Tempo limite inválido').optional(),
});

// ============================================
// 8. DICAS DE INTEGRAÇÃO
// ============================================

/**
 * CHECKLIST DE INTEGRAÇÃO:
 * 
 * ✅ 1. BUSCA FULLTEXT
 * - Adicionar BuscaAvancada em páginas de listagem
 * - Definir colunas para busca
 * - Conectar com hook useBuscaFulltext
 * - Testar com diferentes termos
 * 
 * ✅ 2. FILTROS SALVOS
 * - Aplicar migration SQL (supabase/migrations/)
 * - Adicionar SavedFiltersDropdown nas páginas
 * - Definir entityType correto
 * - Implementar lógica de aplicação de filtros
 * - Testar criação, aplicação, edição e exclusão
 * 
 * ✅ 3. IMPORT CSV
 * - Criar schema Zod para validação
 * - Adicionar CSVImporter em modals/páginas admin
 * - Gerar dados de exemplo
 * - Implementar lógica de importação
 * - Testar com arquivos válidos e inválidos
 * 
 * 📋 ARQUIVOS A CRIAR/MODIFICAR:
 * - /src/hooks/useDebouncedValue.ts (NOVO)
 * - /src/hooks/useBuscaFulltext.ts (NOVO)
 * - /src/hooks/useSavedFilters.ts (NOVO)
 * - /src/lib/csvImporter.ts (NOVO)
 * - /src/components/BuscaAvancada.tsx (NOVO)
 * - /src/components/SavedFiltersDropdown.tsx (NOVO)
 * - /src/components/CSVImporter.tsx (NOVO)
 * - /supabase/migrations/XXXXXX_saved_filters.sql (NOVO)
 * - /src/pages/Admin.tsx (MODIFICAR)
 * - /src/pages/Catalog.tsx (MODIFICAR)
 */
