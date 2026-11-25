import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ReducedMotionProvider,
  SafeMotion,
  useReducedMotion,
} from "@/components/accessibility/ReducedMotionProvider";

const REDUCE_CLASS = "reduce-motion";
const STORAGE_KEY = "reduced-motion";

const originalMatchMedia = window.matchMedia;

const mockMatchMedia = (matches: boolean) => {
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

const Consumer = () => {
  const { shouldAnimate, setReducedMotionEnabled } = useReducedMotion();
  return (
    <div>
      <span data-testid="should-animate">{String(shouldAnimate)}</span>
      <button onClick={() => setReducedMotionEnabled(true)}>reduzir</button>
      <button onClick={() => setReducedMotionEnabled(false)}>restaurar</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <ReducedMotionProvider>
      <Consumer />
    </ReducedMotionProvider>
  );

const reduceClassApplied = () =>
  document.documentElement.classList.contains(REDUCE_CLASS);

describe("ReducedMotionProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(REDUCE_CLASS);
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove(REDUCE_CLASS);
  });

  it("mantém animações quando não há preferência alguma", () => {
    renderProvider();

    expect(screen.getByTestId("should-animate")).toHaveTextContent("true");
    expect(reduceClassApplied()).toBe(false);
  });

  it("aplica a classe reduce-motion a partir da preferência do sistema", () => {
    mockMatchMedia(true);

    renderProvider();

    expect(reduceClassApplied()).toBe(true);
    expect(screen.getByTestId("should-animate")).toHaveTextContent("false");
  });

  it("aplica a classe reduce-motion a partir da preferência salva", () => {
    localStorage.setItem(STORAGE_KEY, "true");

    renderProvider();

    expect(reduceClassApplied()).toBe(true);
    expect(screen.getByTestId("should-animate")).toHaveTextContent("false");
  });

  it("respeita prefers-reduced-motion quando a preferência salva diz o contrário", () => {
    mockMatchMedia(true);
    localStorage.setItem(STORAGE_KEY, "false");

    renderProvider();

    expect(reduceClassApplied()).toBe(true);
    expect(screen.getByTestId("should-animate")).toHaveTextContent("false");
  });

  it("alterna a preferência do usuário, persiste e atualiza a classe", () => {
    renderProvider();

    fireEvent.click(screen.getByText("reduzir"));
    expect(reduceClassApplied()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");

    fireEvent.click(screen.getByText("restaurar"));
    expect(reduceClassApplied()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
  });
});

describe("SafeMotion", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(REDUCE_CLASS);
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove(REDUCE_CLASS);
  });

  it("mostra o conteúdo animado quando não há redução de movimento", () => {
    render(
      <ReducedMotionProvider>
        <SafeMotion fallback={<span>estatico</span>}>
          <span>animado</span>
        </SafeMotion>
      </ReducedMotionProvider>
    );

    expect(screen.getByText("animado")).toBeInTheDocument();
    expect(screen.queryByText("estatico")).not.toBeInTheDocument();
  });

  it("mostra o fallback quando a redução de movimento está ativa", () => {
    localStorage.setItem(STORAGE_KEY, "true");

    render(
      <ReducedMotionProvider>
        <SafeMotion fallback={<span>estatico</span>}>
          <span>animado</span>
        </SafeMotion>
      </ReducedMotionProvider>
    );

    expect(screen.getByText("estatico")).toBeInTheDocument();
    expect(screen.queryByText("animado")).not.toBeInTheDocument();
  });
});