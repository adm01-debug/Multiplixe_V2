import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Filter, Star, Trash2, Copy, Globe, Lock } from 'lucide-react';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface SavedFiltersDropdownProps {
  entityType: string;
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
}

/**
 * Dropdown para gerenciar filtros salvos
 * 
 * Features:
 * - Listar filtros salvos (próprios + públicos)
 * - Salvar filtro atual
 * - Aplicar filtro salvo
 * - Definir filtro padrão
 * - Duplicar filtro
 * - Deletar filtro
 * - Badge indicando filtros públicos vs privados
 * 
 * @example
 * <SavedFiltersDropdown
 *   entityType="courses"
 *   currentFilters={{ status: 'published', category: 'tech' }}
 *   onApplyFilter={(filters) => setFiltros(filters)}
 * />
 */
export function SavedFiltersDropdown({
  entityType,
  currentFilters,
  onApplyFilter,
}: SavedFiltersDropdownProps) {
  const {
    filters,
    saveFilter,
    deleteFilter,
    setDefault,
    duplicateFilter,
    isSaving,
  } = useSavedFilters(entityType);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user on mount
  useState(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data.user?.id ?? null);
      });
    });
  });

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    saveFilter({
      name: filterName,
      description: filterDescription || undefined,
      filters: currentFilters,
      is_public: isPublic,
      is_default: isDefault,
    });

    // Reset form
    setFilterName('');
    setFilterDescription('');
    setIsPublic(false);
    setIsDefault(false);
    setShowSaveDialog(false);
  };

  const handleApplyFilter = (filters: Record<string, any>) => {
    onApplyFilter(filters);
  };

  const ownFilters = filters.filter(f => f.user_id === currentUserId);
  const publicFilters = filters.filter(f => f.is_public && f.user_id !== currentUserId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Salvos
            {filters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Gerenciar Filtros</DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
            <Star className="h-4 w-4 mr-2" />
            Salvar Filtro Atual
          </DropdownMenuItem>

          {ownFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Meus Filtros
              </DropdownMenuLabel>
              
              <DropdownMenuGroup>
                {ownFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div
                      className="flex-1 flex items-center gap-2"
                      onClick={() => handleApplyFilter(filter.filters)}
                    >
                      {filter.is_default && (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                      {filter.is_public ? (
                        <Globe className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{filter.name}</div>
                        {filter.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {filter.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefault(filter.id);
                        }}
                        title="Definir como padrão"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateFilter(filter.id);
                        }}
                        title="Duplicar filtro"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover filtro "${filter.name}"?`)) {
                            deleteFilter(filter.id);
                          }
                        }}
                        title="Deletar filtro"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {publicFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Filtros Públicos
              </DropdownMenuLabel>
              
              <DropdownMenuGroup>
                {publicFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    onClick={() => handleApplyFilter(filter.filters)}
                    className="cursor-pointer"
                  >
                    <Globe className="h-3 w-3 mr-2 text-blue-500" />
                    <div>
                      <div className="font-medium">{filter.name}</div>
                      {filter.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {filter.description}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {filters.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum filtro salvo ainda.
              <br />
              Clique em "Salvar Filtro Atual" para criar um!
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para salvar filtro */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
            <DialogDescription>
              Salve o filtro atual para reutilizar depois
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Nome do Filtro *</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ex: Cursos Publicados de Tecnologia"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="filter-description">Descrição (opcional)</Label>
              <Textarea
                id="filter-description"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Descreva quando usar este filtro..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-public">Filtro Público</Label>
                <div className="text-xs text-muted-foreground">
                  Outros usuários poderão ver e usar
                </div>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-default">Filtro Padrão</Label>
                <div className="text-xs text-muted-foreground">
                  Aplicar automaticamente ao abrir
                </div>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFilter}
              disabled={!filterName.trim() || isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Filtro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
