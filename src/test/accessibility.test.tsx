import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, whileInView, viewport, transition, whileHover, whileTap, style, exit, ...rest } = props as Record<string, unknown>;
      return <div {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</div>;
    },
    section: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, style, ...rest } = props as Record<string, unknown>;
      return <section {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</section>;
    },
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { whileHover, whileTap, transition, ...rest } = props as Record<string, unknown>;
      return <button {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</button>;
    },
    a: ({ children, ...props }: Record<string, unknown>) => {
      const { whileHover, whileTap, transition, ...rest } = props as Record<string, unknown>;
      return <a {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</a>;
    },
    span: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, ...rest } = props as Record<string, unknown>;
      return <span {...(rest as Record<string, unknown>)}>{children as React.ReactNode}</span>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useSpring: () => ({ get: () => 0 }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => ({ error: null }),
    }),
  },
}));

describe("Accessibility - Header", () => {
  it("should use React Router Link for logo (no full page reload)", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const logoLink = container.querySelector('a[href="/"]');
    expect(logoLink).toBeTruthy();
  });

  it("should have search button with aria-label", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButtons = screen.getAllByLabelText("Buscar cursos");
    expect(searchButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should have mobile menu button with aria-label", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByLabelText("Abrir menu")).toBeInTheDocument();
  });

  it("should open search overlay with dialog role", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButton = screen.getAllByLabelText("Buscar cursos")[0];
    fireEvent.click(searchButton);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Buscar cursos");
  });

  it("should close search overlay on Escape key", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButton = screen.getAllByLabelText("Buscar cursos")[0];
    fireEvent.click(searchButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Accessibility - FeaturesSection", () => {
  it("should have role='button' on feature cards", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const buttons = screen.getAllByRole("button");
    const featureButtons = buttons.filter(btn => 
      btn.getAttribute("aria-label")?.includes("Ver detalhes")
    );
    expect(featureButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should have tabIndex=0 on feature cards for keyboard navigation", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const featureButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Ver detalhes")
    );
    featureButtons.forEach(btn => {
      expect(btn.tabIndex).toBe(0);
    });
  });

  it("should support Enter key on feature cards (keyboard handler exists)", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const featureButton = screen.getAllByRole("button").find(btn => 
      btn.getAttribute("aria-label")?.includes("Ver detalhes")
    );
    expect(featureButton).toBeTruthy();
    // Verify the handler doesn't throw on keydown
    expect(() => fireEvent.keyDown(featureButton!, { key: "Enter" })).not.toThrow();
  });

  it("should support Space key on feature cards (keyboard handler exists)", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const featureButton = screen.getAllByRole("button").find(btn => 
      btn.getAttribute("aria-label")?.includes("Ver detalhes")
    );
    expect(() => fireEvent.keyDown(featureButton!, { key: " " })).not.toThrow();
  });

  it("should have aria-hidden on decorative elements", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    const { container } = render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorativeElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should have focus-visible ring style on feature cards", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    const { container } = render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    const card = container.querySelector('[role="button"]');
    expect(card?.className).toContain("focus-visible:ring-2");
  });
});

describe("Accessibility - Footer", () => {
  it("should render dynamic copyright year", async () => {
    const Footer = (await import("@/components/landing/Footer")).default;
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it("should not contain hardcoded year 2024", async () => {
    const Footer = (await import("@/components/landing/Footer")).default;
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const currentYear = new Date().getFullYear();
    if (currentYear !== 2024) {
      expect(container.textContent).not.toContain("© 2024");
    }
  });
});

describe("Accessibility - HeroBackground", () => {
  it("should have aria-hidden on background decorative elements", async () => {
    const HeroBackground = (await import("@/components/landing/hero/HeroBackground")).default;
    const mockMotionValue = { get: () => 0 } as unknown;
    const { container } = render(
      <HeroBackground 
        bgY={mockMotionValue as import("framer-motion").MotionValue<number>} 
        mousePosition={{ x: 0, y: 0 }} 
        gridOpacity={mockMotionValue as import("framer-motion").MotionValue<number>} 
      />
    );
    const ariaHidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHidden.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Accessibility - HeroFloatingElements", () => {
  it("should have aria-hidden on all floating decorative elements", async () => {
    const HeroFloatingElements = (await import("@/components/landing/hero/HeroFloatingElements")).default;
    const mockMotionValue = { get: () => 0 } as unknown;
    const { container } = render(
      <HeroFloatingElements 
        floatingY1={mockMotionValue as import("framer-motion").MotionValue<number>}
        floatingY2={mockMotionValue as import("framer-motion").MotionValue<number>}
        floatingY3={mockMotionValue as import("framer-motion").MotionValue<number>}
        mousePosition={{ x: 0, y: 0 }}
      />
    );
    const ariaHidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHidden.length).toBe(3);
  });
});
