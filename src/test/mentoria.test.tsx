import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  MENTOR_BIO_MAX_CARACTERES,
  MENTOR_MAX_TEMAS,
  MENTOR_TEMA_MAX_CARACTERES,
  PEDIDO_ASSUNTO_MAX,
  PEDIDO_MENSAGEM_MAX,
  PEDIDO_MENSAGEM_MIN,
  iniciaisDe,
  mensagemErroPedido,
  parseTemas,
  rotuloStatus,
  temasParaTexto,
  validarPedido,
  validarPerfilMentor,
} from "@/lib/mentorship";

const mutacoes = vi.hoisted(() => ({
  perfil: vi.fn(),
  pedido: vi.fn(),
  resposta: vi.fn(),
}));

const dados = vi.hoisted(() => ({
  mentores: [] as unknown[],
  painel: {
    sou_mentor: false,
    topics: [] as string[],
    bio: null as string | null,
    recebidos: [] as unknown[],
    enviados: [] as unknown[],
  },
}));

vi.mock("@/hooks/useMentorship", () => ({
  useMentors: () => ({ data: dados.mentores, isLoading: false }),
  useMyMentorship: () => ({ data: dados.painel, isLoading: false }),
  useUpdateMentorProfile: () => ({ mutate: mutacoes.perfil, isPending: false }),
  useRequestMentorship: () => ({ mutate: mutacoes.pedido, isPending: false }),
  useRespondMentorship: () => ({ mutate: mutacoes.resposta, isPending: false }),
}));

vi.mock("@/components/seo/DynamicSEO", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import MentorPage from "@/pages/Mentorship";

const mentor = {
  user_id: "mentor-1",
  full_name: "Ana Souza",
  department: "Operacoes",
  avatar_url: null,
  topics: ["Excel"],
  bio: "Ajudo com planilhas",
  meu_status: null,
};

const renderizar = (rota: string) =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <MentorPage />
    </MemoryRouter>
  );

const desabilitado = (elemento: HTMLElement) => (elemento as HTMLButtonElement).disabled;

describe("parseTemas", () => {
  it("separa por virgula, ponto e virgula e quebra de linha", () => {
    expect(parseTemas("Excel, Metas; Atendimento\nVendas")).toEqual([
      "Excel",
      "Metas",
      "Atendimento",
      "Vendas",
    ]);
  });

  it("remove repetidos ignorando acento e caixa", () => {
    expect(parseTemas("Excel, excel, EXCEL, Logistica, logística")).toEqual(["Excel", "Logistica"]);
  });

  it("colapsa espacos, descarta vazios e corta tema longo", () => {
    const longo = "a".repeat(MENTOR_TEMA_MAX_CARACTERES + 20);
    const lido = parseTemas(`  Excel   e   planilhas ,,   ,${longo}`);

    expect(lido[0]).toBe("Excel e planilhas");
    expect(lido[1]).toHaveLength(MENTOR_TEMA_MAX_CARACTERES);
    expect(lido).toHaveLength(2);
  });

  it("respeita o limite de temas do banco", () => {
    const entrada = Array.from({ length: MENTOR_MAX_TEMAS + 5 }, (_, i) => `Tema ${i}`).join(", ");
    expect(parseTemas(entrada)).toHaveLength(MENTOR_MAX_TEMAS);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(parseTemas("   ")).toEqual([]);
    expect(temasParaTexto([])).toBe("");
    expect(temasParaTexto(["Excel", "Metas"])).toBe("Excel, Metas");
  });
});

describe("iniciaisDe", () => {
  it("usa as duas primeiras palavras em maiusculo", () => {
    expect(iniciaisDe("ana souza")).toBe("AS");
    expect(iniciaisDe("  Joaquim  Ataides  Rosa ")).toBe("JA");
  });

  it("cai para uma letra ou interrogação", () => {
    expect(iniciaisDe("Abner")).toBe("A");
    expect(iniciaisDe("   ")).toBe("?");
  });
});

describe("rotuloStatus", () => {
  it("traduz todos os estados do pedido", () => {
    expect(rotuloStatus("pending")).toBe("Aguardando resposta");
    expect(rotuloStatus("accepted")).toBe("Aceita");
    expect(rotuloStatus("declined")).toBe("Recusada");
    expect(rotuloStatus("completed")).toBe("Concluída");
    expect(rotuloStatus("cancelled")).toBe("Cancelada");
  });
});

describe("validarPedido", () => {
  it("exige assunto e mensagem dentro dos limites do banco", () => {
    expect(validarPedido("ab", "mensagem suficientemente longa")).toContain("assunto");
    expect(validarPedido("a".repeat(PEDIDO_ASSUNTO_MAX + 1), "mensagem suficientemente longa")).toContain(
      String(PEDIDO_ASSUNTO_MAX)
    );
    expect(validarPedido("Excel", "curta")).toContain(String(PEDIDO_MENSAGEM_MIN));
    expect(validarPedido("Excel", "a".repeat(PEDIDO_MENSAGEM_MAX + 1))).toContain(
      String(PEDIDO_MENSAGEM_MAX)
    );
  });

  it("aceita pedido valido", () => {
    expect(validarPedido("Excel", "preciso montar uma tabela dinamica")).toBeNull();
  });
});

describe("validarPerfilMentor", () => {
  it("exige pelo menos um assunto", () => {
    expect(validarPerfilMentor([], "")).toContain("pelo menos um assunto");
  });

  it("recusa mais assuntos que o limite e apresentacao longa", () => {
    const demais = Array.from({ length: MENTOR_MAX_TEMAS + 1 }, (_, i) => `Tema ${i}`);
    expect(validarPerfilMentor(demais, "")).toContain(String(MENTOR_MAX_TEMAS));
    expect(validarPerfilMentor(["Excel"], "a".repeat(MENTOR_BIO_MAX_CARACTERES + 1))).toContain(
      String(MENTOR_BIO_MAX_CARACTERES)
    );
  });

  it("aceita perfil valido", () => {
    expect(validarPerfilMentor(["Excel"], "Ajudo com planilhas")).toBeNull();
  });
});

describe("mensagemErroPedido", () => {
  it("explica pedido duplicado e mentor indisponivel", () => {
    expect(mensagemErroPedido("23505", "duplicate key")).toContain("já tem um pedido pendente");
    expect(mensagemErroPedido("42501", "violates row-level security")).toContain("não está aceitando");
  });

  it("mantem a mensagem original nos demais erros", () => {
    expect(mensagemErroPedido("XX000", "conexao caiu")).toBe("conexao caiu");
    expect(mensagemErroPedido(undefined, "erro generico")).toBe("erro generico");
  });
});

describe("pagina de mentoria", () => {
  beforeEach(() => {
    mutacoes.perfil.mockReset();
    mutacoes.pedido.mockReset();
    mutacoes.resposta.mockReset();
    dados.mentores = [mentor];
    dados.painel = { sou_mentor: false, topics: [], bio: null, recebidos: [], enviados: [] };
  });

  it("lista os mentores disponiveis e monta o resumo do topo", () => {
    renderizar("/mentoria");

    expect(screen.getByRole("heading", { name: "Mentoria" })).toBeTruthy();
    expect(screen.getByText("Ana Souza")).toBeTruthy();
    expect(screen.getByText("Mentores disponíveis")).toBeTruthy();
    expect(screen.getByText("Aguardando mentor")).toBeTruthy();
    expect(screen.getByText("Aguardando você")).toBeTruthy();
  });

  it("bloqueia o envio enquanto a mensagem nao tem o minimo e envia o pedido valido", () => {
    renderizar("/mentoria");

    fireEvent.click(screen.getByRole("button", { name: /Pedir mentoria/i }));

    expect(screen.getByText(/Pedir mentoria para Ana Souza/)).toBeTruthy();
    const assunto = screen.getByLabelText("Assunto") as HTMLInputElement;
    expect(assunto.value).toBe("Excel");

    const enviar = screen.getByRole("button", { name: "Enviar pedido" });
    expect(desabilitado(enviar)).toBe(true);
    expect(screen.getByText(new RegExp(`mínimo ${PEDIDO_MENSAGEM_MIN}`))).toBeTruthy();

    fireEvent.change(screen.getByLabelText("O que você precisa"), {
      target: { value: "  preciso montar uma tabela dinamica  " },
    });

    expect(desabilitado(enviar)).toBe(false);
    fireEvent.click(enviar);

    expect(mutacoes.pedido).toHaveBeenCalledTimes(1);
    expect(mutacoes.pedido.mock.calls[0][0]).toMatchObject({
      mentorId: "mentor-1",
      assunto: "Excel",
    });
  });

  it("nao deixa salvar perfil de mentor sem assunto", () => {
    renderizar("/mentoria?aba=mentor");

    const interruptor = screen.getByLabelText("Quero ser mentor");
    fireEvent.click(interruptor);

    expect(screen.getByText(/pelo menos um assunto/i)).toBeTruthy();
    expect(desabilitado(screen.getByRole("button", { name: "Salvar perfil de mentor" }))).toBe(true);
    expect(mutacoes.perfil).not.toHaveBeenCalled();
  });

  it("salva o perfil de mentor com os assuntos normalizados", () => {
    renderizar("/mentoria?aba=mentor");

    fireEvent.click(screen.getByLabelText("Quero ser mentor"));
    fireEvent.change(screen.getByLabelText("Assuntos em que você ajuda"), {
      target: { value: "Excel, excel, Metas" },
    });
    fireEvent.change(screen.getByLabelText("Apresentação"), {
      target: { value: "  Ajudo com planilhas  " },
    });

    const salvar = screen.getByRole("button", { name: "Salvar perfil de mentor" });
    expect(desabilitado(salvar)).toBe(false);
    fireEvent.click(salvar);

    expect(mutacoes.perfil).toHaveBeenCalledWith({
      is_mentor: true,
      topics: ["Excel", "Metas"],
      bio: "  Ajudo com planilhas  ",
    });
  });
});