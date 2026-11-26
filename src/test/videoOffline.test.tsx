import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoOfflineControls from "@/components/player/VideoOfflineControls";
import {
  LIMITE_BYTES,
  baixarAula,
  calcularPercentual,
  criarArmazenamentoMemoria,
  espacoDisponivel,
  formatoTamanho,
  sincronizarProgresso,
  urlBaixavel,
  type RegistroProgresso,
} from "@/lib/videoOffline";

const respostaFalsa = (conteudo: string, tipo = "video/mp4") => {
  const bytes = new TextEncoder().encode(conteudo);
  const cabecalhos: Record<string, string> = {
    "content-type": tipo,
    "content-length": String(bytes.length),
  };
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

  return {
    ok: true,
    status: 200,
    headers: { get: (nome: string) => cabecalhos[nome.toLowerCase()] ?? null },
    body,
  } as unknown as Response;
};

const buscarFalso = (conteudo: string) => vi.fn(async () => respostaFalsa(conteudo));

const registro = (lessonId: string): RegistroProgresso => ({
  user_id: "u-1",
  lesson_id: lessonId,
  course_id: "c-1",
  last_position_seconds: 42,
  watched_seconds: 42,
  is_completed: false,
  completed_at: null,
});

describe("formatoTamanho", () => {
  it("mostra KB para arquivos pequenos e MB com vírgula decimal", () => {
    expect(formatoTamanho(0)).toBe("0 MB");
    expect(formatoTamanho(2048)).toBe("2 KB");
    expect(formatoTamanho(12.3 * 1024 * 1024)).toBe("12,3 MB");
  });
});

describe("calcularPercentual", () => {
  it("devolve null sem total conhecido e limita entre 0 e 100", () => {
    expect(calcularPercentual(10, 0)).toBeNull();
    expect(calcularPercentual(50, 100)).toBe(50);
    expect(calcularPercentual(500, 100)).toBe(100);
    expect(calcularPercentual(-5, 100)).toBe(0);
  });
});

describe("urlBaixavel", () => {
  it("aceita apenas http e https", () => {
    expect(urlBaixavel("https://cdn.exemplo.com/aula.mp4")).toBe(true);
    expect(urlBaixavel("http://cdn.exemplo.com/aula.mp4")).toBe(true);
    expect(urlBaixavel("blob:https://app/123")).toBe(false);
    expect(urlBaixavel(null)).toBe(false);
  });
});

describe("espacoDisponivel", () => {
  it("respeita o limite do aparelho", () => {
    expect(espacoDisponivel(0, LIMITE_BYTES)).toBe(true);
    expect(espacoDisponivel(LIMITE_BYTES, 1)).toBe(false);
  });
});

describe("baixarAula", () => {
  it("grava o vídeo no armazenamento e informa o progresso", async () => {
    const armazenamento = criarArmazenamentoMemoria();
    const percentuais: Array<number | null> = [];

    const salvo = await baixarAula(
      { lessonId: "l-1", titulo: "Aula 1", url: "https://cdn.exemplo.com/aula.mp4" },
      {
        armazenamento,
        buscar: buscarFalso("conteudo-do-video"),
        aoProgredir: (_recebido, _total, percentual) => percentuais.push(percentual),
        agora: () => new Date("2026-11-26T10:00:00.000Z"),
      },
    );

    expect(salvo.lesson_id).toBe("l-1");
    expect(salvo.baixado_em).toBe("2026-11-26T10:00:00.000Z");
    expect(salvo.tamanho_bytes).toBe(17);
    expect(percentuais.includes(100)).toBe(true);
    expect((await armazenamento.obterVideo("l-1"))).toBeInstanceOf(Blob);
    expect(await armazenamento.listarVideos()).toHaveLength(1);
  });

  it("recusa quando o limite de espaço do aparelho já foi usado", async () => {
    const armazenamento = criarArmazenamentoMemoria();
    await armazenamento.salvarVideo(
      {
        lesson_id: "l-antiga",
        titulo: "Aula antiga",
        url: "https://cdn.exemplo.com/antiga.mp4",
        tamanho_bytes: LIMITE_BYTES,
        baixado_em: "2026-11-20T10:00:00.000Z",
      },
      new Blob(["x"]),
    );

    await expect(
      baixarAula(
        { lessonId: "l-2", titulo: "Aula 2", url: "https://cdn.exemplo.com/aula2.mp4" },
        { armazenamento, buscar: buscarFalso("outro-conteudo") },
      ),
    ).rejects.toThrow(/Sem espaço no aparelho/);

    expect(await armazenamento.listarVideos()).toHaveLength(1);
  });

  it("propaga erro de HTTP sem gravar nada", async () => {
    const armazenamento = criarArmazenamentoMemoria();
    const buscar = vi.fn(async () => ({ ok: false, status: 404 }) as unknown as Response);

    await expect(
      baixarAula(
        { lessonId: "l-3", titulo: "Aula 3", url: "https://cdn.exemplo.com/aula3.mp4" },
        { armazenamento, buscar },
      ),
    ).rejects.toThrow(/HTTP 404/);

    expect(await armazenamento.listarVideos()).toHaveLength(0);
  });
});

describe("fila de progresso offline", () => {
  it("guarda apenas o último progresso de cada aula", async () => {
    const armazenamento = criarArmazenamentoMemoria();

    await armazenamento.guardarProgresso(registro("l-1"));
    await armazenamento.guardarProgresso({ ...registro("l-1"), last_position_seconds: 90 });

    const pendentes = await armazenamento.listarProgresso();

    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].registro.last_position_seconds).toBe(90);
  });

  it("envia a fila e limpa o que foi aceito", async () => {
    const armazenamento = criarArmazenamentoMemoria();
    await armazenamento.guardarProgresso(registro("l-1"));
    await armazenamento.guardarProgresso(registro("l-2"));
    const enviar = vi.fn(async () => true);

    const resultado = await sincronizarProgresso(enviar, armazenamento);

    expect(resultado).toEqual({ enviados: 2, restantes: 0 });
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(await armazenamento.listarProgresso()).toHaveLength(0);
  });

  it("para no primeiro erro e preserva o restante da fila", async () => {
    const armazenamento = criarArmazenamentoMemoria();
    await armazenamento.guardarProgresso(registro("l-1"));
    await armazenamento.guardarProgresso(registro("l-2"));
    const enviar = vi.fn(async () => false);

    const resultado = await sincronizarProgresso(enviar, armazenamento);

    expect(resultado).toEqual({ enviados: 0, restantes: 2 });
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(await armazenamento.listarProgresso()).toHaveLength(2);
  });
});

describe("VideoOfflineControls", () => {
  const base = {
    online: true,
    baixando: false,
    percentual: null as number | null,
    baixado: null,
    podeBaixar: true,
    aoBaixar: vi.fn(),
    aoCancelar: vi.fn(),
    aoRemover: vi.fn(),
    totalBaixadas: 0,
    tamanhoTotal: "0 MB",
    aoLimparTudo: vi.fn(),
  };

  it("oferece o download quando a aula ainda não está no aparelho", () => {
    const aoBaixar = vi.fn();
    render(<VideoOfflineControls {...base} aoBaixar={aoBaixar} />);

    fireEvent.click(screen.getByRole("button", { name: /baixar aula/i }));

    expect(aoBaixar).toHaveBeenCalledTimes(1);
  });

  it("mostra o percentual e permite cancelar durante o download", () => {
    const aoCancelar = vi.fn();
    render(<VideoOfflineControls {...base} baixando percentual={45} aoCancelar={aoCancelar} />);

    expect(screen.getByText("45%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(aoCancelar).toHaveBeenCalledTimes(1);
  });

  it("mostra o vídeo disponível offline com tamanho e opção de remover", () => {
    const aoRemover = vi.fn();
    render(
      <VideoOfflineControls
        {...base}
        baixado={{
          lesson_id: "l-1",
          titulo: "Aula 1",
          url: "https://cdn.exemplo.com/aula.mp4",
          tamanho_bytes: 5 * 1024 * 1024,
          baixado_em: "2026-11-26T10:00:00.000Z",
        }}
        aoRemover={aoRemover}
      />,
    );

    expect(screen.getByText(/Disponível offline/)).toBeTruthy();
    expect(screen.getByText("5,0 MB")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /remover do aparelho/i }));
    expect(aoRemover).toHaveBeenCalledTimes(1);
  });

  it("avisa quando está sem conexão e a aula não está baixada", () => {
    render(<VideoOfflineControls {...base} online={false} />);

    expect(screen.getByText(/Sem conexão e esta aula não está baixada/)).toBeTruthy();
  });

  it("lista o uso do aparelho e remove todas as aulas", () => {
    const aoLimparTudo = vi.fn();
    render(
      <VideoOfflineControls
        {...base}
        totalBaixadas={3}
        tamanhoTotal="120,0 MB"
        aoLimparTudo={aoLimparTudo}
      />,
    );

    expect(screen.getByText(/Aulas neste aparelho: 3 · 120,0 MB/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /remover todas/i }));
    expect(aoLimparTudo).toHaveBeenCalledTimes(1);
  });

  it("não aparece quando a aula não tem vídeo para baixar", () => {
    const { container } = render(<VideoOfflineControls {...base} podeBaixar={false} />);

    expect(container.firstChild).toBeNull();
  });
});