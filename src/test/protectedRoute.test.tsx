import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ProtectedRoute", () => {
  it("should redirect unauthenticated users", async () => {
    const ProtectedRoute = (await import("@/components/ProtectedRoute")).default;
    
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Should not show protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});

describe("ProtectedRoute with authenticated user", () => {
  it("should render children for authenticated users", async () => {
    const { useAuth } = await import("@/hooks/useAuth");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "123", email: "test@test.com" },
      session: { access_token: "token" },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    const ProtectedRoute = (await import("@/components/ProtectedRoute")).default;

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
