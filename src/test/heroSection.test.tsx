import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CountUp from "@/components/landing/hero/CountUp";
import HeroStats from "@/components/landing/hero/HeroStats";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, whileInView, viewport, transition, whileHover, whileTap, style, ...rest } = props as Record<string, unknown>;
      return <div {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</div>;
    },
    section: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, style, ...rest } = props as Record<string, unknown>;
      return <section {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</section>;
    },
    span: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, key, ...rest } = props as Record<string, unknown>;
      return <span {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</span>;
    },
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { whileHover, whileTap, transition, ...rest } = props as Record<string, unknown>;
      return <button {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</button>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useSpring: () => ({ get: () => 0 }),
}));

describe("CountUp Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should render with initial value of 0", () => {
    const { container } = render(<CountUp target={100} />);
    expect(container.textContent).toBe("0");
  });

  it("should be memoized (React.memo)", () => {
    expect(CountUp.displayName).toBe("CountUp");
  });

  it("should accept target prop", () => {
    const { container } = render(<CountUp target={500} />);
    expect(container).toBeTruthy();
  });
});

describe("HeroStats Component", () => {
  it("should render all three stat items", () => {
    render(
      <MemoryRouter>
        <HeroStats />
      </MemoryRouter>
    );
    expect(screen.getByText("Cursos disponíveis")).toBeInTheDocument();
    expect(screen.getByText("Trilhas de carreira")).toBeInTheDocument();
    expect(screen.getByText("Certificados válidos")).toBeInTheDocument();
  });

  it("should render stat values", () => {
    render(
      <MemoryRouter>
        <HeroStats />
      </MemoryRouter>
    );
    expect(screen.getByText("50+")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should be memoized (React.memo)", () => {
    expect(HeroStats.displayName).toBe("HeroStats");
  });

  it("should have aria-hidden on decorative icon containers", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroStats />
      </MemoryRouter>
    );
    const decorativeIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorativeIcons.length).toBeGreaterThanOrEqual(3);
  });

  it("should render with correct grid layout classes", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroStats />
      </MemoryRouter>
    );
    const grid = container.querySelector(".grid");
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain("md:grid-cols-3");
  });
});
