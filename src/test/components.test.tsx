import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("EmptyState Component", () => {
  it("should render with title and description", async () => {
    const EmptyState = (await import("@/components/EmptyState")).default;

    render(
      <EmptyState
        title="Nenhum resultado"
        description="Tente outra busca"
      />
    );

    expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
    expect(screen.getByText("Tente outra busca")).toBeInTheDocument();
  });
});

describe("PageLoader Component", () => {
  it("should render loading spinner", async () => {
    const PageLoader = (await import("@/components/PageLoader")).default;
    const { container } = render(<PageLoader />);
    
    // Should render a loading element
    expect(container.firstChild).toBeInTheDocument();
  });
});
