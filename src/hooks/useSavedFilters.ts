import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FiltroSalvo {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  filters: Record<string, string | null>;
  is_default: boolean;
  is_public: boolean;
  created_at: string;
}

const CAMPOS = "id, user_id, entity_type, name, description, filters, is_default, is_public, created_at";

interface Resultado {
  error: string | null;
}

export const useSavedFilters = (entityType: string) => {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState<FiltroSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const userId = user?.id ?? null;

  const recarregar = useCallback(async () => {
    if (!userId) {
      setFiltros([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const { data } = await supabase
      .from("saved_filters")
      .select(CAMPOS)
      .eq("entity_type", entityType)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    setFiltros((data ?? []) as unknown as FiltroSalvo[]);
    setCarregando(false);
  }, [entityType, userId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const salvar = useCallback(
    async (nome: string, filters: Record<string, string | null>): Promise<Resultado> => {
      if (!userId) return { error: "Faça login para salvar filtros" };

      const name = nome.trim();
      if (!name) return { error: "Dê um nome ao filtro" };
      if (name.length > 60) return { error: "O nome do filtro pode ter no máximo 60 caracteres" };

      setSalvando(true);
      const { error } = await supabase
        .from("saved_filters")
        .insert({ user_id: userId, entity_type: entityType, name, filters });
      setSalvando(false);

      if (error) {
        return { error: error.code === "23505" ? "Você já tem um filtro com esse nome" : error.message };
      }

      await recarregar();
      return { error: null };
    },
    [entityType, recarregar, userId],
  );

  const remover = useCallback(async (id: string): Promise<Resultado> => {
    const { error } = await supabase.from("saved_filters").delete().eq("id", id);
    if (error) return { error: error.message };

    setFiltros((anteriores) => anteriores.filter((filtro) => filtro.id !== id));
    return { error: null };
  }, []);

  return { filtros, carregando, salvando, salvar, remover, recarregar };
};