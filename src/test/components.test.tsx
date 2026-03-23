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
  it("should render with type", async () => {
    const EmptyState = (await import("@/components/EmptyState")).default;

    render(
      <EmptyState type="courses" />
    );

    // Should render some content
    expect(document.body.textContent).toBeTruthy();
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
