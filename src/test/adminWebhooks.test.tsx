import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminWebhooksTab from "@/components/admin/AdminWebhooksTab";
import {
  contagensEntregas,
  mascararSecret,
  validarEndpoint,
  type EntregaWebhook,
} from "@/hooks/useAdminWebhooks";

interface DbCall {
  op: "insert" | "update" | "delete";
  table: string;
  payload?: unknown;
  patch?: unknown;
  column?: string;
  value?: unknown;
}

interface Builder {
  select: () => Builder;
  order: () => Builder;
  limit: () => Promise<{ data: unknown; error: unknown }>;
  then: (resolve: (value: unknown) => unknown) => unknown;
  insert: (payload: unknown) => Builder;
  single: () => Promise<{ data: unknown; error: unknown }>;
  update: (patch: unknown) => Builder;
  eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
  not: (column: string, op: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
  delete: () => Builder;
}

const { calls, toastSuccess, toastError, state, rpc } = vi.hoisted(() => ({
  calls: [] as DbCall[],
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  rpc: vi.fn(),
  state: {
    endpoints: [] as unknown[],
    entregas: [] as unknown[],
    insertError: null as null | { message?: string },
  },
}));

vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));

vi.mock("@/integrations/supabase/client", () => {
  const make = (table: string) => {
    const result = () => ({
      data: table === "webhook_endpoints" ? state.endpoints : state.entregas,
      error: null,
    });
    const builder = {} as Builder;
    const self = () => builder;
    builder.select = self;
    builder.order = self;
    builder.limit = async () => result();
    builder.then = (resolve: (value: unknown) => unknown) => resolve(result());
    builder.insert = (payload: unknown) => {
      calls.push({ op: "insert", table, payload });
      return builder;
    };
    builder.single = async () => ({ data: { id: "novo-id" }, error: state.insertError });
    builder.update = (patch: unknown) => {
      calls.push({ op: "update", table, patch });
      return builder;
    };
    builder.eq = async (column: string, value: unknown) => {
      const ultima = calls[calls.length - 1];
      if (ultima && ultima.op !== "insert") {
        ultima.column = column;
        ultima.value = value;
      }
      return { data: null, error: null };
    };
    builder.not = async () => ({ data: null, error: null });
    builder.delete = () => {
      calls.push({ op: "delete", table });
      return builder;
    };
    return builder;
  };

  return {
    supabase: { from: (table: string) => make(table), rpc: (...args: unknown[]) => rpc(...args) },
  };
});

const ENDPOINT = {
  id: "ep-1",
  nome: "RH - Folha",
  url: "https://rh.cliente.com/hook",
  eventos: ["curso.concluido", "certificado.emitido"],
  secret: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  is_active: true,
  descricao: "Envia conclusões para o RH",
  created_at: "2026-11-26T12:00:00.000Z",
};

const ENTREGA = {
  id: "d-1",
  endpoint_id: "ep-1",
  evento: "curso.concluido",
  status: "entregue",
  tentativas: 1,
  resposta_status: 200,
  erro: null,
  created_at: "2026-11-26T12:05:00.000Z",
  entregue_em: "2026-11-26T12:05:01.000Z",
};

const renderTab = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminWebhooksTab />
    </QueryClientProvider>,
  );
};

describe("validarEndpoint", () => {
  const base = {
    nome: "Destino",
    url: "https://destino.com/hook",
    eventos: ["curso.concluido"],
    descricao: null,
    is_active: true,
  };

  it("aceita um endpoint completo", () => {
    expect(validarEndpoint(base)).toBeNull();
  });

  it("recusa URL sem https", () => {
    expect(validarEndpoint({ ...base, url: "http://destino.com/hook" })).toContain("https://");
  });

  it("recusa endpoint sem evento assinado", () => {
    expect(validarEndpoint({ ...base, eventos: [] })).toContain("pelo menos um evento");
  });

  it("recusa evento fora da lista suportada", () => {
    expect(validarEndpoint({ ...base, eventos: ["evento.inventado"] })).toContain("não suportado");
  });
});

describe("contagensEntregas", () => {
  it("separa entregues, pendentes e falhas", () => {
    const entregas = [
      { status: "entregue" },
      { status: "entregue" },
      { status: "pendente" },
      { status: "falhou" },
    ] as EntregaWebhook[];

    expect(contagensEntregas(entregas)).toEqual({ entregues: 2, pendentes: 1, falhas: 1 });
  });
});

describe("mascararSecret", () => {
  it("mostra apenas o início e o fim do segredo", () => {
    const mascarado = mascararSecret(ENDPOINT.secret);

    expect(mascarado.startsWith("abcdef")).toBe(true);
    expect(mascarado.endsWith("7890")).toBe(true);
    expect(mascarado).not.toContain("1234567890abcdef");
  });
});

describe("AdminWebhooksTab", () => {
  beforeEach(() => {
    calls.length = 0;
    toastSuccess.mockClear();
    toastError.mockClear();
    rpc.mockReset();
    rpc.mockResolvedValue({ data: 1, error: null });
    state.endpoints = [ENDPOINT];
    state.entregas = [ENTREGA];
    state.insertError = null;
  });

  it("lista o endpoint com eventos traduzidos e segredo mascarado", async () => {
    renderTab();

    expect(await screen.findByRole("heading", { name: "RH - Folha" })).toBeTruthy();
    expect(screen.getByText("https://rh.cliente.com/hook")).toBeTruthy();
    expect(screen.getAllByText("Curso concluído").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Certificado emitido").length).toBeGreaterThan(0);
    expect(screen.getByText("Ativo")).toBeTruthy();

    const campoSecret = document.getElementById("secret-ep-1") as HTMLInputElement;
    expect(campoSecret.value).not.toBe(ENDPOINT.secret);
    expect(campoSecret.value).toContain("•");
  });

  it("mostra o histórico de entregas com situação e contagem", async () => {
    renderTab();

    expect(await screen.findByText("1 entregues · 0 aguardando · 0 com falha")).toBeTruthy();
    expect(screen.getAllByText("Entregue").length).toBeGreaterThan(0);
    expect(screen.getByText("200")).toBeTruthy();
  });

  it("mostra estado vazio quando não há endpoint", async () => {
    state.endpoints = [];
    state.entregas = [];
    renderTab();

    expect(await screen.findByText("Nenhum endpoint configurado")).toBeTruthy();
    expect(screen.getByText("Nenhuma entrega registrada ainda.")).toBeTruthy();
  });

  it("bloqueia o salvamento de URL inválida sem gravar no banco", async () => {
    renderTab();
    await screen.findByRole("heading", { name: "RH - Folha" });

    fireEvent.click(screen.getByRole("button", { name: /novo endpoint/i }));
    fireEvent.change(document.getElementById("webhook-nome") as HTMLInputElement, {
      target: { value: "Destino novo" },
    });
    fireEvent.change(document.getElementById("webhook-url") as HTMLInputElement, {
      target: { value: "http://sem-https.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar endpoint/i }));

    expect(await screen.findByText(/precisa começar com https/)).toBeTruthy();
    expect(calls.some((chamada) => chamada.op === "insert")).toBe(false);
  });

  it("cria o endpoint com o payload esperado", async () => {
    renderTab();
    await screen.findByRole("heading", { name: "RH - Folha" });

    fireEvent.click(screen.getByRole("button", { name: /novo endpoint/i }));
    fireEvent.change(document.getElementById("webhook-nome") as HTMLInputElement, {
      target: { value: "Slack RH" },
    });
    fireEvent.change(document.getElementById("webhook-url") as HTMLInputElement, {
      target: { value: "https://hooks.slack.com/services/xyz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar endpoint/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const insercao = calls.find((chamada) => chamada.op === "insert");
    expect(insercao?.table).toBe("webhook_endpoints");
    expect(insercao?.payload).toMatchObject({
      nome: "Slack RH",
      url: "https://hooks.slack.com/services/xyz",
      eventos: ["curso.concluido", "certificado.emitido"],
      is_active: true,
      descricao: null,
    });
  });

  it("envia evento de teste pela RPC e reporta o enfileiramento", async () => {
    renderTab();
    await screen.findByRole("heading", { name: "RH - Folha" });

    fireEvent.click(screen.getByRole("button", { name: /enviar teste/i }));

    await waitFor(() => expect(rpc).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith(
      "enfileirar_webhook",
      expect.objectContaining({ p_evento: "teste", p_endpoint_id: "ep-1" }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("enfileirado")),
    );
  });

  it("avisa quando o endpoint não recebe o evento de teste", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    renderTab();
    await screen.findByRole("heading", { name: "RH - Folha" });

    fireEvent.click(screen.getByRole("button", { name: /enviar teste/i }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("não recebe o evento")),
    );
  });

  it("alerta quando a RPC falha", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "sem permissao" } });
    renderTab();
    await screen.findByRole("heading", { name: "RH - Folha" });

    fireEvent.click(screen.getByRole("button", { name: /enviar teste/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining("sem permissao")),
    );
  });
});