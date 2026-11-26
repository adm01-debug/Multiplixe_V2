import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FontSizeControl from "@/components/accessibility/FontSizeControl";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const ROOT = document.documentElement;
const FONT_KEY = "font-size-preference";

beforeEach(() => {
  localStorage.clear();
  ROOT.style.fontSize = "";
  ROOT.style.removeProperty("--base-font-size");
  document.body.className = "";
  ROOT.className = "";
});

describe("FontSizeControl", () => {
  it("aplica no carregamento o tamanho salvo pelo usuario", () => {
    localStorage.setItem(FONT_KEY, "20");
    render(<FontSizeControl />);
    expect(ROOT.style.fontSize).toBe("20px");
    expect(ROOT.style.getPropertyValue("--base-font-size")).toBe("20px");
  });

  it("nao altera o tamanho quando nao ha preferencia salva", () => {
    render(<FontSizeControl />);
    expect(ROOT.style.fontSize).toBe("");
  });

  it("ignora valor salvo fora da faixa permitida", () => {
    localStorage.setItem(FONT_KEY, "99");
    render(<FontSizeControl />);
    expect(ROOT.style.fontSize).toBe("");
  });

  it("aumenta a fonte em 1px e persiste a preferencia", () => {
    render(<FontSizeControl />);
    fireEvent.click(screen.getByLabelText("Ajustar tamanho da fonte"));
    fireEvent.click(screen.getByLabelText("Aumentar fonte"));
    expect(ROOT.style.fontSize).toBe("17px");
    expect(localStorage.getItem(FONT_KEY)).toBe("17");
    expect(screen.getByText("106%")).toBeInTheDocument();
  });

  it("diminui a fonte em 1px e persiste a preferencia", () => {
    localStorage.setItem(FONT_KEY, "18");
    render(<FontSizeControl />);
    fireEvent.click(screen.getByLabelText("Ajustar tamanho da fonte"));
    fireEvent.click(screen.getByLabelText("Diminuir fonte"));
    expect(ROOT.style.fontSize).toBe("17px");
    expect(localStorage.getItem(FONT_KEY)).toBe("17");
  });

  it("aplica um preset e reseta para o padrao", () => {
    render(<FontSizeControl />);
    fireEvent.click(screen.getByLabelText("Ajustar tamanho da fonte"));
    fireEvent.click(screen.getByText("Grande"));
    expect(ROOT.style.fontSize).toBe("20px");
    fireEvent.click(screen.getByText("Restaurar Padrão"));
    expect(ROOT.style.fontSize).toBe("16px");
    expect(localStorage.getItem(FONT_KEY)).toBe("16");
  });
});

describe("AccessibilityWidget com controle de fonte", () => {
  it("revela o controle de fonte ao abrir o painel", () => {
    render(<AccessibilityWidget />);
    const trigger = screen.getByLabelText("Ajustar tamanho da fonte");
    const wrapper = trigger.parentElement as HTMLElement;
    expect(wrapper).toHaveClass("hidden");
    fireEvent.click(screen.getByLabelText("Opções de acessibilidade"));
    expect(wrapper).not.toHaveClass("hidden");
  });

  it("aplica a preferencia de fonte salva mesmo com o painel fechado", () => {
    localStorage.setItem(FONT_KEY, "22");
    render(<AccessibilityWidget />);
    expect(ROOT.style.fontSize).toBe("22px");
  });
});