import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePuxarParaAtualizar, useSwipeHorizontal } from "@/hooks/useGestosMobile";

function AreaSwipe(props: {
  aoAvancar?: () => void;
  aoVoltar?: () => void;
  habilitado?: boolean;
}) {
  const gestos = useSwipeHorizontal(props);
  return (
    <div data-testid="area" {...gestos}>
      <button type="button" data-testid="botao">
        Assistir
      </button>
      <input data-testid="campo" aria-label="Comentario" />
      <div data-testid="barra" role="slider" aria-label="Progresso" />
      <div data-testid="trilha" data-gesto-ignorar="true" />
    </div>
  );
}

function AreaPuxar(props: {
  aoAtualizar: () => unknown;
  limite?: number;
  estaNoTopo?: () => boolean;
  habilitado?: boolean;
}) {
  const { puxado, atualizando, limite, aoPuxar } = usePuxarParaAtualizar(props);
  return (
    <div data-testid="area" {...aoPuxar}>
      <span data-testid="limite">{limite}</span>
      <span data-testid="estado">
        {atualizando ? "atualizando" : puxado > 0 ? `puxado:${Math.round(puxado)}` : "parado"}
      </span>
    </div>
  );
}

function iniciarGesto(origem: Element, x: number, y: number) {
  fireEvent.touchStart(origem, { touches: [{ clientX: x, clientY: y }] });
}

function terminarGesto(origem: Element, x: number, y: number) {
  fireEvent.touchEnd(origem, { changedTouches: [{ clientX: x, clientY: y }] });
}

describe("useSwipeHorizontal", () => {
  it("avanca com arrasto para a esquerda e volta com arrasto para a direita", () => {
    const aoAvancar = vi.fn();
    const aoVoltar = vi.fn();
    render(<AreaSwipe aoAvancar={aoAvancar} aoVoltar={aoVoltar} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 260, 300);
    terminarGesto(area, 120, 305);
    expect(aoAvancar).toHaveBeenCalledTimes(1);

    iniciarGesto(area, 120, 300);
    terminarGesto(area, 280, 295);
    expect(aoVoltar).toHaveBeenCalledTimes(1);
    expect(aoAvancar).toHaveBeenCalledTimes(1);
  });

  it("ignora arrasto curto e arrasto predominantemente vertical (rolagem)", () => {
    const aoAvancar = vi.fn();
    const aoVoltar = vi.fn();
    render(<AreaSwipe aoAvancar={aoAvancar} aoVoltar={aoVoltar} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 200, 200);
    terminarGesto(area, 160, 200);

    iniciarGesto(area, 200, 100);
    terminarGesto(area, 120, 400);

    expect(aoAvancar).not.toHaveBeenCalled();
    expect(aoVoltar).not.toHaveBeenCalled();
  });

  it("nao sequestra gestos iniciados em botao, campo ou barra de progresso", () => {
    const aoAvancar = vi.fn();
    const aoVoltar = vi.fn();
    render(<AreaSwipe aoAvancar={aoAvancar} aoVoltar={aoVoltar} />);

    for (const alvo of ["botao", "campo", "barra", "trilha"]) {
      iniciarGesto(screen.getByTestId(alvo), 260, 300);
      terminarGesto(screen.getByTestId(alvo), 100, 300);
    }

    expect(aoAvancar).not.toHaveBeenCalled();
    expect(aoVoltar).not.toHaveBeenCalled();
  });

  it("nao navega quando desabilitado", () => {
    const aoAvancar = vi.fn();
    render(<AreaSwipe aoAvancar={aoAvancar} habilitado={false} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 260, 300);
    terminarGesto(area, 100, 300);

    expect(aoAvancar).not.toHaveBeenCalled();
  });
});

describe("usePuxarParaAtualizar", () => {
  it("mostra o progresso, solta a partir do limite e volta ao repouso", async () => {
    const aoAtualizar = vi.fn(() => Promise.resolve());
    render(<AreaPuxar aoAtualizar={aoAtualizar} limite={70} />);
    const area = screen.getByTestId("area");
    expect(screen.getByTestId("limite").textContent).toBe("70");

    iniciarGesto(area, 0, 10);
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 210 }] });
    expect(screen.getByTestId("estado").textContent).toBe("puxado:100");

    terminarGesto(area, 0, 210);
    await waitFor(() => expect(screen.getByTestId("estado").textContent).toBe("parado"));
    expect(aoAtualizar).toHaveBeenCalledTimes(1);
  });

  it("nao recarrega com puxada abaixo do limite", () => {
    const aoAtualizar = vi.fn(() => Promise.resolve());
    render(<AreaPuxar aoAtualizar={aoAtualizar} limite={70} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 0, 10);
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 70 }] });
    terminarGesto(area, 0, 70);

    expect(aoAtualizar).not.toHaveBeenCalled();
    expect(screen.getByTestId("estado").textContent).toBe("parado");
  });

  it("nao recarrega quando a pagina nao esta no topo", () => {
    const aoAtualizar = vi.fn(() => Promise.resolve());
    render(<AreaPuxar aoAtualizar={aoAtualizar} limite={70} estaNoTopo={() => false} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 0, 10);
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 300 }] });
    terminarGesto(area, 0, 300);

    expect(aoAtualizar).not.toHaveBeenCalled();
  });

  it("mantem o indicador ativo enquanto a recarga esta em andamento", async () => {
    let concluir: () => void = () => {};
    const aoAtualizar = vi.fn(
      () => new Promise<void>((resolver) => {
        concluir = resolver;
      }),
    );
    render(<AreaPuxar aoAtualizar={aoAtualizar} limite={70} />);
    const area = screen.getByTestId("area");

    iniciarGesto(area, 0, 10);
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 220 }] });
    terminarGesto(area, 0, 220);

    expect(screen.getByTestId("estado").textContent).toBe("atualizando");
    concluir();
    await waitFor(() => expect(screen.getByTestId("estado").textContent).toBe("parado"));
  });

  it("bloqueia o recarregamento nativo do navegador enquanto o gesto esta ativo", () => {
    const aoAtualizar = vi.fn(() => Promise.resolve());
    const { unmount } = render(<AreaPuxar aoAtualizar={aoAtualizar} />);
    expect(document.documentElement.style.overscrollBehaviorY).toBe("contain");
    unmount();
    expect(document.documentElement.getAttribute("style") || "").not.toContain("overscroll-behavior-y");
  });
});