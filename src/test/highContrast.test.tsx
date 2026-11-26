import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import HighContrastToggle from "@/components/accessibility/HighContrastToggle";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";

const HC_CLASS = "high-contrast";
const HC_KEY = "high-contrast-mode";
const originalMatchMedia = window.matchMedia;

const mockContrastMedia = (matches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const contrastApplied = () =>
  document.documentElement.classList.contains(HC_CLASS);

const toggleButton = () =>
  screen.getByRole("button", { name: /alto contraste/i });

describe("HighContrastToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(HC_CLASS);
    mockContrastMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove(HC_CLASS);
  });

  it("começa desligado e sem a classe no html", () => {
    render(<HighContrastToggle />);

    expect(contrastApplied()).toBe(false);
    expect(toggleButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("liga a classe, persiste a preferência e anuncia o estado", () => {
    render(<HighContrastToggle />);

    fireEvent.click(toggleButton());

    expect(contrastApplied()).toBe(true);
    expect(localStorage.getItem(HC_KEY)).toBe("true");
    expect(toggleButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("desliga de volta e persiste a preferência desligada", () => {
    localStorage.setItem(HC_KEY, "true");
    render(<HighContrastToggle />);
    expect(contrastApplied()).toBe(true);

    fireEvent.click(toggleButton());

    expect(contrastApplied()).toBe(false);
    expect(localStorage.getItem(HC_KEY)).toBe("false");
  });

  it("aplica sozinho quando o sistema pede mais contraste", () => {
    mockContrastMedia(true);

    render(<HighContrastToggle />);

    expect(contrastApplied()).toBe(true);
  });

  it("não sobrescreve a preferência salva do usuário", () => {
    mockContrastMedia(true);
    localStorage.setItem(HC_KEY, "false");

    render(<HighContrastToggle />);

    expect(contrastApplied()).toBe(false);
  });
});

describe("AccessibilityWidget", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(HC_CLASS);
    mockContrastMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove(HC_CLASS);
  });

  it("expõe o botão de acessibilidade fechado por padrão", () => {
    render(<AccessibilityWidget />);

    const trigger = screen.getByRole("button", { name: /acessibilidade/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("mostra o controle de alto contraste ao abrir", () => {
    render(<AccessibilityWidget />);

    fireEvent.click(screen.getByRole("button", { name: /acessibilidade/i }));

    expect(screen.getByRole("button", { name: /alto contraste/i })).toBeInTheDocument();
  });

  it("liga o alto contraste a partir do widget", () => {
    render(<AccessibilityWidget />);

    fireEvent.click(screen.getByRole("button", { name: /acessibilidade/i }));
    fireEvent.click(screen.getByRole("button", { name: /alto contraste/i }));

    expect(contrastApplied()).toBe(true);
  });

  it("mantém a preferência salva aplicada mesmo com o painel fechado", () => {
    localStorage.setItem(HC_KEY, "true");

    render(<AccessibilityWidget />);

    expect(contrastApplied()).toBe(true);
  });
});