import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';

interface BuscaAvancadaProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  debounceDelay?: number;
}

/**
 * Componente de busca avançada com debounce e UX otimizada
 * 
 * Features:
 * - Ícone de busca
 * - Debounce configurável (padrão 300ms)
 * - Botão para limpar busca
 * - Loading indicator
 * - Contador de caracteres
 * 
 * @example
 * <BuscaAvancada
 *   onSearch={(term) => setBusca(term)}
 *   placeholder="Buscar cursos..."
 *   isLoading={isLoadingCursos}
 * />
 */
export function BuscaAvancada({
  onSearch,
  placeholder = "Buscar em todos os campos...",
  className = "",
  isLoading = false,
  debounceDelay = 300,
}: BuscaAvancadaProps) {
  const [termo, setTermo] = useState('');
  const termoDebounced = useDebouncedValue(termo, debounceDelay);

  useEffect(() => {
    onSearch(termoDebounced);
  }, [termoDebounced, onSearch]);

  const handleClear = () => {
    setTermo('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Ícone de busca */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      
      {/* Input */}
      <Input
        type="text"
        placeholder={placeholder}
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        className="pl-10 pr-20"
      />
      
      {/* Loading ou Clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        {termo && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6"
            title="Limpar busca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Contador de caracteres (opcional) */}
      {termo.length > 0 && termo.length < 2 && (
        <span className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
          Digite pelo menos 2 caracteres para buscar
        </span>
      )}
    </div>
  );
}
