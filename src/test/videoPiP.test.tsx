import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import VideoPlayer from "@/components/player/VideoPlayer";

const requestPiP = vi.fn(() => Promise.resolve(undefined));

const renderPlayer = () =>
  render(
    <TooltipProvider>
      <VideoPlayer src="aula.mp4" title="Aula 1" />
    </TooltipProvider>,
  );

const setPiPEnabled = (enabled: boolean) => {
  Object.defineProperty(document, "pictureInPictureEnabled", { configurable: true, value: enabled });
};

beforeEach(() => {
  requestPiP.mockClear();
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: vi.fn(() => Promise.resolve()),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, writable: true, value: vi.fn() });
  Object.defineProperty(HTMLMediaElement.prototype, "requestPictureInPicture", {
    configurable: true,
    writable: true,
    value: requestPiP,
  });
  setPiPEnabled(true);
});

describe("VideoPlayer picture-in-picture (MOB-004)", () => {
  it("mostra o botao quando o navegador suporta e chama a API", () => {
    const { container } = renderPlayer();

    fireEvent.click(screen.getByRole("button", { name: /assistir em picture-in-picture/i }));

    expect(requestPiP).toHaveBeenCalledTimes(1);
    expect(container.querySelector("video")).toBeTruthy();
  });

  it("marca o botao como ativo ao entrar em PiP e volta ao sair", () => {
    const { container } = renderPlayer();
    const video = container.querySelector("video") as HTMLVideoElement;

    fireEvent(video, new Event("enterpictureinpicture"));
    expect(screen.getByRole("button", { name: /sair do picture-in-picture/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent(video, new Event("leavepictureinpicture"));
    expect(screen.getByRole("button", { name: /assistir em picture-in-picture/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("atalho de teclado p alterna o modo", () => {
    renderPlayer();
    fireEvent.keyDown(window, { key: "p" });
    expect(requestPiP).toHaveBeenCalledTimes(1);
  });

  it("esconde o botao quando o navegador nao suporta", () => {
    setPiPEnabled(false);
    renderPlayer();
    expect(screen.queryByRole("button", { name: /picture-in-picture/i })).toBeNull();
  });
});