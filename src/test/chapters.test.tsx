import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CHAPTERS_MAX,
  CHAPTER_TITLE_MAX,
  chapterAt,
  chapterPosition,
  formatChapterTime,
  parseChapters,
} from "@/lib/chapters";
import ChaptersPanel from "@/components/player/ChaptersPanel";
import VideoPlayer from "@/components/player/VideoPlayer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { t } from "@/lib/i18n";

describe("parseChapters", () => {
  it("devolve lista vazia para qualquer coisa que nao seja array", () => {
    expect(parseChapters(null)).toEqual([]);
    expect(parseChapters(undefined)).toEqual([]);
    expect(parseChapters({ title: "Introducao" })).toEqual([]);
    expect(parseChapters("[]")).toEqual([]);
    expect(parseChapters([])).toEqual([]);
  });

  it("limpa titulo, converte segundo quebrado e ordena por inicio", () => {
    const lido = parseChapters([
      { title: "  Fechamento  ", start_seconds: 125.9 },
      { title: "Introducao", start_seconds: 0 },
      { title: "Meio", start_seconds: "60" },
    ]);
    expect(lido).toEqual([
      { title: "Introducao", start_seconds: 0 },
      { title: "Meio", start_seconds: 60 },
      { title: "Fechamento", start_seconds: 125 },
    ]);
  });

  it("descarta item sem titulo, sem inicio, negativo ou que nao seja objeto", () => {
    const lido = parseChapters([
      null,
      "texto",
      { title: "", start_seconds: 5 },
      { title: "   ", start_seconds: 6 },
      { title: "Sem inicio" },
      { title: "Texto no inicio", start_seconds: "abc" },
      { title: "Negativo", start_seconds: -10 },
      { title: "Bom", start_seconds: 12 },
    ]);
    expect(lido).toEqual([{ title: "Bom", start_seconds: 12 }]);
  });

  it("mantem o primeiro capitulo quando dois comecam no mesmo segundo", () => {
    const lido = parseChapters([
      { title: "Primeiro", start_seconds: 30 },
      { title: "Repetido", start_seconds: 30 },
    ]);
    expect(lido).toEqual([{ title: "Primeiro", start_seconds: 30 }]);
  });

  it("corta titulo gigante e respeita o teto de capitulos", () => {
    const gigante = parseChapters([{ title: "a".repeat(200), start_seconds: 0 }]);
    expect(gigante[0].title).toHaveLength(CHAPTER_TITLE_MAX);

    const muitos = Array.from({ length: 80 }, (_, i) => ({ title: `Cap ${i}`, start_seconds: i * 10 }));
    expect(parseChapters(muitos)).toHaveLength(CHAPTERS_MAX);
  });
});

describe("formatChapterTime", () => {
  it("mostra m:ss abaixo de uma hora e h:mm:ss acima", () => {
    expect(formatChapterTime(0)).toBe("0:00");
    expect(formatChapterTime(9)).toBe("0:09");
    expect(formatChapterTime(65)).toBe("1:05");
    expect(formatChapterTime(600)).toBe("10:00");
    expect(formatChapterTime(3600)).toBe("1:00:00");
    expect(formatChapterTime(3725)).toBe("1:02:05");
  });

  it("nunca mostra tempo negativo", () => {
    expect(formatChapterTime(-30)).toBe("0:00");
  });
});

describe("chapterAt", () => {
  const capitulos = parseChapters([
    { title: "Abertura", start_seconds: 0 },
    { title: "Meio", start_seconds: 120 },
    { title: "Fim", start_seconds: 300 },
  ]);

  it("devolve null antes do primeiro capitulo", () => {
    expect(chapterAt([{ title: "Depois", start_seconds: 60 }], 10)).toBeNull();
  });

  it("devolve o capitulo vigente em cada trecho", () => {
    expect(chapterAt(capitulos, 0)).toMatchObject({ title: "Abertura" });
    expect(chapterAt(capitulos, 119)).toMatchObject({ title: "Abertura" });
    expect(chapterAt(capitulos, 120)).toMatchObject({ title: "Meio" });
    expect(chapterAt(capitulos, 9999)).toMatchObject({ title: "Fim" });
  });

  it("sem capitulos nao ha capitulo atual", () => {
    expect(chapterAt([], 42)).toBeNull();
  });
});

describe("chapterPosition", () => {
  it("converte o inicio em porcentagem da duracao", () => {
    expect(chapterPosition({ title: "Meio", start_seconds: 30 }, 120)).toBe(25);
    expect(chapterPosition({ title: "Comeco", start_seconds: 0 }, 120)).toBe(0);
  });

  it("prende a posicao entre 0 e 100", () => {
    expect(chapterPosition({ title: "Depois do fim", start_seconds: 300 }, 120)).toBe(100);
  });

  it("sem duracao valida nao ha posicao", () => {
    expect(chapterPosition({ title: "Meio", start_seconds: 30 }, 0)).toBeNull();
    expect(chapterPosition({ title: "Meio", start_seconds: 30 }, Number.NaN)).toBeNull();
  });
});

describe("textos dos capitulos", () => {
  const chaves = [
    "chapters.title",
    "chapters.now",
    "chapters.jumpTo",
    "chapters.adminTitle",
    "chapters.adminEmpty",
    "chapters.add",
    "chapters.namePlaceholder",
    "chapters.startLabel",
    "chapters.remove",
    "chapters.afterEnd",
    "chapters.duplicateStart",
  ] as const;

  it("existe nos tres idiomas", () => {
    for (const locale of ["pt-BR", "en", "es"] as const) {
      for (const chave of chaves) {
        const texto = t(chave, locale);
        expect(texto, `${locale} ${chave}`).not.toBe(chave);
        expect(texto.length, `${locale} ${chave}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("ChaptersPanel", () => {
  const capitulos = parseChapters([
    { title: "Introducao", start_seconds: 0 },
    { title: "Proposta", start_seconds: 90 },
  ]);

  it("nao aparece quando a aula nao tem capitulos", () => {
    const { container } = render(<ChaptersPanel chapters={[]} currentSeconds={0} onSeek={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lista os capitulos com o tempo de inicio", () => {
    render(<ChaptersPanel chapters={capitulos} currentSeconds={0} onSeek={vi.fn()} />);
    expect(screen.getByRole("heading", { name: t("chapters.title") })).toBeInTheDocument();
    expect(screen.getByText("Introducao")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("pula para o trecho clicado", () => {
    const onSeek = vi.fn();
    render(<ChaptersPanel chapters={capitulos} currentSeconds={0} onSeek={onSeek} />);
    fireEvent.click(screen.getByText("Proposta"));
    expect(onSeek).toHaveBeenCalledWith(90);
  });

  it("marca o capitulo que esta tocando", () => {
    render(<ChaptersPanel chapters={capitulos} currentSeconds={100} onSeek={vi.fn()} />);
    const atual = screen.getByRole("button", { name: /Proposta/ });
    expect(atual).toHaveAttribute("aria-current", "true");
    expect(screen.getByText(t("chapters.now"))).toBeInTheDocument();
  });
});

describe("atalhos do player com capitulos", () => {
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();

  beforeEach(() => {
    play.mockClear();
    pause.mockClear();
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, writable: true, value: play });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, writable: true, value: pause });
    Object.defineProperty(HTMLMediaElement.prototype, "duration", { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get: () => true });
  });

  const renderPlayer = () =>
    render(
      <TooltipProvider>
        <VideoPlayer src="aula.mp4" title="Aula 1" chapters={[{ title: "Introducao", start_seconds: 0 }]} />
      </TooltipProvider>,
    );

  const marcarDuracao = (container: HTMLElement) => {
    const video = container.querySelector("video");
    if (video) fireEvent(video, new Event("loadedmetadata"));
    return video;
  };

  it("mostra o marcador do capitulo na barra", () => {
    const { container } = renderPlayer();
    marcarDuracao(container);
    expect(screen.getByRole("button", { name: /Introducao/ })).toHaveAttribute("title", "0:00 · Introducao");
  });

  it("Espaco em um botao da interface nao rouba o clique do capitulo", () => {
    const { container } = renderPlayer();
    marcarDuracao(container);
    fireEvent.keyDown(screen.getByRole("button", { name: /Introducao/ }), { key: " " });
    expect(play).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it("Espaco fora de botoes continua alternando a reproducao", () => {
    const { container } = renderPlayer();
    marcarDuracao(container);
    fireEvent.keyDown(document.body, { key: " " });
    expect(play).toHaveBeenCalledTimes(1);
  });
});
