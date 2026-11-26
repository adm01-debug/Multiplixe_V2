import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TRANSCRICAO_MAX_CARACTERES_LINHA,
  TRANSCRICAO_MAX_LINHAS,
  filtrarTranscricao,
  indiceDaLinhaAtiva,
  parseTranscricao,
} from "@/lib/transcricao";
import TranscriptPanel from "@/components/player/TranscriptPanel";
import { t } from "@/lib/i18n";

describe("parseTranscricao", () => {
  it("devolve lista vazia para qualquer coisa que nao seja texto", () => {
    expect(parseTranscricao(null)).toEqual([]);
    expect(parseTranscricao(undefined)).toEqual([]);
    expect(parseTranscricao({ text: "oi" })).toEqual([]);
    expect(parseTranscricao([])).toEqual([]);
    expect(parseTranscricao("   \n  ")).toEqual([]);
  });

  it("le os tres formatos de marcador e mantem linhas sem tempo", () => {
    const linhas = parseTranscricao(
      ["Abertura da aula", "0:45 Primeiro assunto", "[01:05] - Segundo assunto", "1:02:03 Encerramento"].join("\n")
    );
    expect(linhas).toEqual([
      { seconds: null, text: "Abertura da aula" },
      { seconds: 45, text: "Primeiro assunto" },
      { seconds: 65, text: "Segundo assunto" },
      { seconds: 3723, text: "Encerramento" },
    ]);
  });

  it("descarta marcador sem texto e limita quantidade e tamanho", () => {
    expect(parseTranscricao("00:10   \n00:20 valido")).toEqual([{ seconds: 20, text: "valido" }]);

    const longa = "9:59 " + "a".repeat(TRANSCRICAO_MAX_CARACTERES_LINHA + 100);
    expect(parseTranscricao(longa)[0].text).toHaveLength(TRANSCRICAO_MAX_CARACTERES_LINHA);

    const muitas = Array.from({ length: TRANSCRICAO_MAX_LINHAS + 50 }, (_, i) => `${i}:00 trecho ${i}`).join("\n");
    expect(parseTranscricao(muitas)).toHaveLength(TRANSCRICAO_MAX_LINHAS);
  });
});

describe("indiceDaLinhaAtiva", () => {
  const linhas = parseTranscricao("0:00 inicio\n0:30 meio\n1:00 fim");

  it("aponta o ultimo trecho ja alcancado", () => {
    expect(indiceDaLinhaAtiva(linhas, 0)).toBe(0);
    expect(indiceDaLinhaAtiva(linhas, 29)).toBe(0);
    expect(indiceDaLinhaAtiva(linhas, 30)).toBe(1);
    expect(indiceDaLinhaAtiva(linhas, 59)).toBe(1);
    expect(indiceDaLinhaAtiva(linhas, 900)).toBe(2);
  });

  it("devolve -1 antes do primeiro marcador ou com tempo invalido", () => {
    const comAbertura = parseTranscricao("Abertura\n0:30 meio");
    expect(indiceDaLinhaAtiva(comAbertura, 10)).toBe(-1);
    expect(indiceDaLinhaAtiva(linhas, -5)).toBe(-1);
    expect(indiceDaLinhaAtiva(linhas, Number.NaN)).toBe(-1);
    expect(indiceDaLinhaAtiva([], 10)).toBe(-1);
  });
});

describe("filtrarTranscricao", () => {
  const linhas = parseTranscricao("0:00 Introdução ao módulo\n0:40 Configuração da conta");

  it("busca sem acento e sem caixa alta", () => {
    expect(filtrarTranscricao(linhas, "INTRODUCAO").map((r) => r.indice)).toEqual([0]);
    expect(filtrarTranscricao(linhas, "configuracao").map((r) => r.indice)).toEqual([1]);
  });

  it("termo vazio devolve tudo e termo sem match devolve nada", () => {
    expect(filtrarTranscricao(linhas, "")).toHaveLength(2);
    expect(filtrarTranscricao(linhas, "inexistente")).toEqual([]);
  });
});

describe("TranscriptPanel", () => {
  const transcricao = "0:00 Abertura\n0:30 Primeiro assunto\n1:00 Segundo assunto";

  it("nao renderiza nada quando nao ha transcricao", () => {
    const { container } = render(<TranscriptPanel transcript={null} currentSeconds={0} onSeek={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(t("transcript.title"))).toBeNull();
  });

  it("lista os trechos e pula para o segundo clicado", () => {
    const onSeek = vi.fn();
    render(<TranscriptPanel transcript={transcricao} currentSeconds={0} onSeek={onSeek} />);

    expect(screen.getByText(t("transcript.title"))).toBeInTheDocument();
    fireEvent.click(screen.getByText("Segundo assunto"));
    expect(onSeek).toHaveBeenCalledWith(60);
  });

  it("marca o trecho atual com aria-current", () => {
    render(<TranscriptPanel transcript={transcricao} currentSeconds={45} onSeek={vi.fn()} />);

    const atual = screen.getByText("Primeiro assunto").closest("button");
    expect(atual).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Abertura").closest("button")).not.toHaveAttribute("aria-current");
  });

  it("filtra os trechos pela busca", () => {
    render(<TranscriptPanel transcript={transcricao} currentSeconds={0} onSeek={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(t("transcript.searchPlaceholder")), { target: { value: "segundo" } });
    expect(screen.queryByText("Abertura")).toBeNull();
    expect(screen.getByText("Segundo assunto")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t("transcript.searchPlaceholder")), { target: { value: "zzz" } });
    expect(screen.getByText(t("transcript.searchEmpty"))).toBeInTheDocument();
  });
});