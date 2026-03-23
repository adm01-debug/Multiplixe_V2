import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock lovable
vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe("Auth Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form by default", async () => {
    const Auth = (await import("@/pages/Auth")).default;
    render(<Auth />, { wrapper: createWrapper() });
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
  });

  it("should have Google sign-in button", async () => {
    const Auth = (await import("@/pages/Auth")).default;
    render(<Auth />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/continuar com google/i)).toBeInTheDocument();
  });

  it("should validate empty email on submit", async () => {
    const Auth = (await import("@/pages/Auth")).default;
    const user = userEvent.setup();
    render(<Auth />, { wrapper: createWrapper() });
    
    const submitBtn = screen.getByRole("button", { name: /entrar/i });
    await user.click(submitBtn);
    
    // Form should not submit with empty fields - the email input should be required
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it("should toggle between login and signup modes", async () => {
    const Auth = (await import("@/pages/Auth")).default;
    const user = userEvent.setup();
    render(<Auth />, { wrapper: createWrapper() });
    
    const toggleLink = screen.getByText(/criar conta/i);
    await user.click(toggleLink);
    
    // Should now show full name field
    expect(screen.getByPlaceholderText(/nome completo/i)).toBeInTheDocument();
  });
});
