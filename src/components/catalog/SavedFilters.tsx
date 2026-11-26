import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Globe, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSavedFilters, type FiltroSalvo } from "@/hooks/useSavedFilters";

interface SavedFiltersProps {
  entityType: string;
  filtrosAtuais: Record<string, string | null>;
  temFiltrosAtivos: boolean;
  onAplicar: (filtros: Record<string, string | null>) => void;
}

const resumoFiltro = (filtro: FiltroSalvo) =>
  Object.values(filtro.filters ?? {})
    .filter((valor): valor is string => Boolean(valor))
    .join(" · ");

const SavedFilters = ({ entityType, filtrosAtuais, temFiltrosAtivos, onAplicar }: SavedFiltersProps) => {
  const { user } = useAuth();
  const { filtros, carregando, salvando, salvar, remover } = useSavedFilters(entityType);
  const [nome, setNome] = useState("");

  const handleSalvar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!temFiltrosAtivos) {
      toast.info("Escolha ao menos um filtro antes de salvar");
      return;
    }

    const { error } = await salvar(nome, filtrosAtuais);
    if (error) {
      toast.error("Não foi possível salvar o filtro", { description: error });
      return;
    }

    setNome("");
    toast.success("Filtro salvo!", { description: "Ele fica disponível sempre que você abrir o catálogo." });
  };

  const handleRemover = async (filtro: FiltroSalvo) => {
    const { error } = await remover(filtro.id);
    if (error) {
      toast.error("Não foi possível remover o filtro", { description: error });
      return;
    }
    toast.success(`Filtro "${filtro.name}" removido`);
  };

  return (
    <section aria-labelledby="filtros-salvos-titulo" className="space-y-3">
      <p id="filtros-salvos-titulo" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Bookmark className="h-4 w-4" aria-hidden="true" /> Filtros salvos
      </p>

      {carregando ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando filtros salvos...
        </p>
      ) : filtros.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum filtro salvo ainda. Ajuste os filtros abaixo e salve para reutilizar depois.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" role="list">
          {filtros.map((filtro) => {
            const meu = filtro.user_id === user?.id;
            const resumo = resumoFiltro(filtro);
            return (
              <li key={filtro.id} className="flex items-center gap-1 rounded-full border border-border/60 bg-card/60 pl-1 pr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-2 text-foreground"
                  aria-label={`Aplicar filtro ${filtro.name}`}
                  onClick={() => onAplicar(filtro.filters ?? {})}
                >
                  {filtro.is_public && !meu && <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                  <span>{filtro.name}</span>
                  {resumo && <span className="text-xs text-muted-foreground hidden sm:inline">{resumo}</span>}
                  {filtro.is_default && <Badge variant="secondary" className="text-[10px]">padrão</Badge>}
                </Button>
                {meu && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label={`Remover filtro ${filtro.name}`}
                    onClick={() => void handleRemover(filtro)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSalvar} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="nome-filtro-salvo" className="sr-only">Nome do filtro</label>
        <Input
          id="nome-filtro-salvo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          placeholder="Nome do filtro (ex.: Vendas avançado)"
          className="h-11 sm:max-w-xs rounded-xl border-border/50 bg-card/50"
        />
        <Button type="submit" variant="outline" className="h-11 rounded-xl border-border/50" disabled={salvando}>
          {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Salvar filtros atuais
        </Button>
      </form>
    </section>
  );
};

export default SavedFilters;