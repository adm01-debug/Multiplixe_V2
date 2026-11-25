import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkipLinks from "@/components/accessibility/SkipLinks";

const renderWithLandmarks = (html: string) => {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return render(<SkipLinks />, { container: document.body.appendChild(document.createElement("div")) });
};

describe("SkipLinks", () => {
  it("renderiza atalho para o conteúdo principal quando existe <main>", () => {
    renderWithLandmarks('<main><h1>Conteudo</h1></main>');
    expect(screen.getByRole("navigation", { name: "Links de atalho" })).toBeTruthy();
    expect(screen.getByText("Pular para o conteúdo principal")).toBeTruthy();
  });

  it("não renderiza atalho de rodapé quando não existe footer", () => {
    renderWithLandmarks('<main><h1>Conteudo</h1></main>');
    expect(screen.queryByText("Pular para o rodapé")).toBeNull();
  });

  it("renderiza atalho de rodapé quando existe footer", () => {
    renderWithLandmarks('<main><h1>Conteudo</h1></main><footer>Rodape</footer>');
    expect(screen.getByText("Pular para o rodapé")).toBeTruthy();
  });

  it("não renderiza nada quando a página não tem landmarks", () => {
    renderWithLandmarks('<div>Apenas conteudo</div>');
    expect(screen.queryByRole("navigation", { name: "Links de atalho" })).toBeNull();
  });

  it("foca o alvo e aplica tabindex -1 ao acionar o atalho", () => {
    renderWithLandmarks('<main id="main-content"><h1>Conteudo</h1></main>');
    const link = screen.getByText("Pular para o conteúdo principal");
    fireEvent.click(link);

    const main = document.querySelector("main") as HTMLElement;
    expect(main.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(main);
  });

  it("prefere o elemento com id canônico quando existe", () => {
    renderWithLandmarks('<main><h1>Generico</h1></main><main id="main-content"><h1>Canonico</h1></main>');
    fireEvent.click(screen.getByText("Pular para o conteúdo principal"));

    expect(document.activeElement).toBe(document.getElementById("main-content"));
  });
});