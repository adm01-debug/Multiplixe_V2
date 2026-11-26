import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SavedFilters from "@/components/catalog/SavedFilters";
import type { FiltroSalvo } from "@/hooks/useSavedFilters";

interface DbCall {
  op: "insert" | "delete";
  payload?: unknown;
}

const { calls, state, toastSuccess, toastError, toastInfo } = vi.hoisted(() => ({
  calls: [] as DbCall[],
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  state: {
    filtros: [] as FiltroSalvo[],
    erro: null as null | { message: string; code?: string },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError, info: toastInfo },
}));

vi.mock("@/hooks/useAuth", () => {
  const user = { id: "user-1", email: "ana@promobrindes.com.br" };
  return { useAuth: () => ({ user, session: { user } }) };
});

vi.mock("@/integrations/supabase/client", () => {
  const make = () => {
    const api = {
      select: () => api,
      eq: () => api,
      order: () => api,
      insert: (payload: unknown) => {
        calls.push({ op: "insert", payload });
        return api;
      },
      delete: () => {
        calls.push({ op: "delete" });
        return api;
      },
      then: (resolve: (valor: unknown) => unknown) => {
        const ultima = calls[calls.length - 1];
        const gravando = ultima && (ultima.op === "insert" || ultima.op === "delete");
        return resolve(gravando ? { data: null, error: state.erro } : { data: state.filtros, error: null });
      },
    };
    return api;
  };

  return { supabase: { from: () => make() } };
});

const filtroProprio: FiltroSalvo = {
  id: "f-1",
  user_id: "user-1",
  entity_type: "courses",
  name: "Vendas avançado",
  description: null,
  filters: { q: "vendas", categoria: "vendas", nivel: "avancado" },
  is_default: false,
  is_public: false,
  created_at: "2026-11-26T00:00:00Z",
};

const filtroPublico: FiltroSalvo = {
  ...filtroProprio,
  id: "f-2",
  user_id: "user-9",
  name: "Trilha de liderança",
  is_public: true,
  filters: { categoria: "lideranca" },
};

const renderizar = (onAplicar = vi.fn(), temFiltrosAtivos = true) => {
  render(
    <SavedFilters
      entityType="courses"
      filtrosAtuais={{ q: "vendas", categoria: null, nivel: "avancado" }}
      temFiltrosAtivos={temFiltrosAtivos}
      onAplicar={onAplicar}
    />,
  );
  return { onAplicar };
};

beforeEach(() => {
  calls.length = 0;
  state.filtros = [filtroProprio];
  state.erro = null;
  vi.clearAllMocks();
});

describe("SavedFilters", () => {
  it("lista os filtros salvos e aplica o filtro escolhido", async () => {
    const { onAplicar } = renderizar();

    const botao = await screen.findByRole("button", { name: "Aplicar filtro Vendas avançado" });
    fireEvent.click(botao);

    expect(onAplicar).toHaveBeenCalledWith({ q: "vendas", categoria: "vendas", nivel: "avancado" });
  });

  it("salva os filtros atuais com o nome digitado", async () => {
    renderizar();

    fireEvent.change(await screen.findByLabelText("Nome do filtro"), { target: { value: "Meu filtro" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar filtros atuais/ }));

    await waitFor(() => expect(calls.some((c) => c.op === "insert")).toBe(true));
    expect(calls.find((c) => c.op === "insert")?.payload).toEqual({
      user_id: "user-1",
      entity_type: "courses",
      name: "Meu filtro",
      filters: { q: "vendas", categoria: null, nivel: "avancado" },
    });
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("não salva quando não há filtro ativo", async () => {
    renderizar(vi.fn(), false);

    fireEvent.change(await screen.findByLabelText("Nome do filtro"), { target: { value: "Vazio" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar filtros atuais/ }));

    await waitFor(() => expect(toastInfo).toHaveBeenCalled());
    expect(calls.some((c) => c.op === "insert")).toBe(false);
  });

  it("avisa quando o nome já está em uso", async () => {
    state.erro = { message: "duplicate key value", code: "23505" };
    renderizar();

    fireEvent.change(await screen.findByLabelText("Nome do filtro"), { target: { value: "Repetido" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar filtros atuais/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Não foi possível salvar o filtro",
        expect.objectContaining({ description: "Você já tem um filtro com esse nome" }),
      ),
    );
  });

  it("só oferece remoção para os próprios filtros", async () => {
    state.filtros = [filtroProprio, filtroPublico];
    renderizar();

    expect(await screen.findByRole("button", { name: "Remover filtro Vendas avançado" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover filtro Trilha de liderança" })).toBeNull();
  });

  it("remove o filtro escolhido", async () => {
    renderizar();

    fireEvent.click(await screen.findByRole("button", { name: "Remover filtro Vendas avançado" }));

    await waitFor(() => expect(calls.some((c) => c.op === "delete")).toBe(true));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Aplicar filtro Vendas avançado" })).toBeNull());
  });
});