/**
 * Janela de disponibilidade de uma conquista (GAME-009).
 *
 * Uma conquista pode ser permanente, ter janela propria (`starts_at` / `ends_at`) ou estar
 * amarrada a um evento sazonal (`seasonal_event_id`). Quando existe janela, o servidor
 * (`public.conquista_disponivel`) so concede dentro dela; aqui a mesma ideia vira rotulo de UI.
 */

export type EstadoJanela = "permanente" | "disponivel" | "aguardando" | "encerrada" | "evento";

export interface JanelaConquista {
  starts_at?: string | null;
  ends_at?: string | null;
  seasonal_event_id?: string | null;
}

const lerData = (valor?: string | null): Date | null => {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
};

/** Situacao da conquista no instante informado. `evento` = prazo definido pelo evento vinculado. */
export const estadoDaJanela = (janela: JanelaConquista, agora: Date = new Date()): EstadoJanela => {
  const inicio = lerData(janela.starts_at);
  const fim = lerData(janela.ends_at);

  if (!inicio && !fim) return janela.seasonal_event_id ? "evento" : "permanente";
  if (inicio && agora < inicio) return "aguardando";
  if (fim && agora > fim) return "encerrada";
  return "disponivel";
};

const formatarData = (data: Date) =>
  data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Texto do selo; `null` quando a conquista e permanente. */
export const rotuloDaJanela = (janela: JanelaConquista, agora: Date = new Date()): string | null => {
  const inicio = lerData(janela.starts_at);
  const fim = lerData(janela.ends_at);

  switch (estadoDaJanela(janela, agora)) {
    case "permanente":
      return null;
    case "aguardando":
      return inicio ? `Sazonal · a partir de ${formatarData(inicio)}` : "Sazonal";
    case "disponivel":
      return fim ? `Sazonal · até ${formatarData(fim)}` : "Sazonal";
    case "encerrada":
      return fim ? `Encerrada em ${formatarData(fim)}` : "Encerrada";
    case "evento":
      return "Sazonal · prazo do evento";
  }
};