import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import VideoPlayer from "@/components/player/VideoPlayer";
import { useSwipeHorizontal } from "@/hooks/useGestosMobile";

// Tela equivalente à do LessonPlayer: o gesto fica no conteúdo que envolve o vídeo.
function TelaAula({ aoAvancar }: { aoAvancar: () => void }) {
  const gestos = useSwipeHorizontal({ aoAvancar });
  return (
    <div data-testid="conteudo" {...gestos}>
      <VideoPlayer src="aula.mp4" title="Aula 1" />
    </div>
  );
}

// Identifica a barra de progresso pela coluna em que ela vive, nao pelo atributo
// que o proprio teste verifica (a barra de volume compartilha a marcacao).
function barraDeProgresso(container: HTMLElement): Element | null {
  const barra = container.querySelector('div[class*="group/progress"] [data-gesto-ignorar="true"]');
  if (barra?.closest('[class*="group/volume"]')) throw new Error("capturou a barra de volume");
  return barra;
}

function deslizar(alvo: Element) {
  fireEvent.touchStart(alvo, { touches: [{ clientX: 300, clientY: 400 }] });
  fireEvent.touchEnd(alvo, { changedTouches: [{ clientX: 180, clientY: 402 }] });
}

describe("gesto de troca de aula sobre os controles reais do video", () => {
  it("nao troca de aula ao arrastar a barra de progresso", () => {
    const aoAvancar = vi.fn();
    const { container } = render(
      <TooltipProvider>
        <TelaAula aoAvancar={aoAvancar} />
      </TooltipProvider>,
    );
    const barra = barraDeProgresso(container);
    expect(barra).not.toBeNull();

    deslizar(barra as Element);

    expect(aoAvancar).not.toHaveBeenCalled();
  });

  it("troca de aula ao arrastar na faixa de controles, fora das barras", () => {
    const aoAvancar = vi.fn();
    const { container } = render(
      <TooltipProvider>
        <TelaAula aoAvancar={aoAvancar} />
      </TooltipProvider>,
    );
    const barra = barraDeProgresso(container);
    const faixaControles = barra?.closest('div[class*="absolute bottom-0"]');
    expect(faixaControles).not.toBeNull();

    deslizar(faixaControles as Element);

    expect(aoAvancar).toHaveBeenCalledTimes(1);
  });

  it("troca de aula ao arrastar sobre o video", () => {
    const aoAvancar = vi.fn();
    const { container } = render(
      <TooltipProvider>
        <TelaAula aoAvancar={aoAvancar} />
      </TooltipProvider>,
    );
    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    deslizar(video as Element);

    expect(aoAvancar).toHaveBeenCalledTimes(1);
  });
});