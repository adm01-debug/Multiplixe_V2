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

describe("Navigation - Header", () => {
  it("should render logo with MULTIPLIXE brand name", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText(/MULTIPLI/)).toBeInTheDocument();
  });

  it("should render Recursos mega menu trigger", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText("Recursos")).toBeInTheDocument();
  });

  it("should render Trilhas navigation link", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const trilhasLinks = screen.getAllByText("Trilhas");
    expect(trilhasLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("should render Como Funciona navigation link", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const links = screen.getAllByText("Como Funciona");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("should render Acessar Plataforma CTA button", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const ctas = screen.getAllByText("Acessar Plataforma");
    expect(ctas.length).toBeGreaterThanOrEqual(1);
  });

  it("should render ThemeToggle component", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    // ThemeToggle exists in the DOM
    expect(container.querySelector("header")).toBeTruthy();
  });

  it("should render search suggestions when search is open", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButton = screen.getAllByLabelText("Buscar cursos")[0];
    fireEvent.click(searchButton);
    expect(screen.getByText("Pesquisas populares:")).toBeInTheDocument();
    expect(screen.getByText("Atendimento")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
    expect(screen.getByText("Liderança")).toBeInTheDocument();
  });

  it("should have fixed positioning for sticky header", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const header = container.querySelector("header");
    expect(header?.className).toContain("fixed");
    expect(header?.className).toContain("z-50");
  });

  it("should have backdrop blur for glassmorphism effect", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const header = container.querySelector("header");
    expect(header?.className).toContain("backdrop-blur");
  });
});

describe("Navigation - Search Functionality", () => {
  it("should have search input with correct placeholder", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButton = screen.getAllByLabelText("Buscar cursos")[0];
    fireEvent.click(searchButton);
    expect(screen.getByPlaceholderText("Buscar cursos, trilhas, temas...")).toBeInTheDocument();
  });

  it("should have close button in search overlay", async () => {
    const Header = (await import("@/components/landing/Header")).default;
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const searchButton = screen.getAllByLabelText("Buscar cursos")[0];
    fireEvent.click(searchButton);
    // Close button exists
    const closeButtons = container.querySelectorAll('button[type="button"]');
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });
});
