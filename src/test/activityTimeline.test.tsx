import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActivityTimeline from "@/components/activity/ActivityTimeline";

const DAY = 24 * 60 * 60 * 1000;
const recent = new Date(Date.now() - 2 * DAY).toISOString();
const old = new Date(Date.now() - 40 * DAY).toISOString();

const rows: Record<string, unknown[]> = {
  user_lesson_progress: [
    {
      id: "l1",
      completed_at: recent,
      lessons: { title: "Aula recente", course_id: "c1", courses: { title: "Curso A" } },
    },
  ],
  user_course_progress: [
    { id: "c2", completed_at: old, courses: { title: "Curso antigo" } },
  ],
  user_achievements: [],
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const chain = () => b;
    const b = {
      select: chain,
      eq: chain,
      not: chain,
      order: chain,
      limit: chain,
      then: (resolve: (value: { data: unknown[] }) => unknown) =>
        Promise.resolve({ data: rows[table] ?? [] }).then(resolve),
    };
    return b;
  };
  return { supabase: { from: (table: string) => builder(table) } };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

const renderTimeline = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ActivityTimeline limit={10} />
    </QueryClientProvider>,
  );
};

describe("historico de atividades (FUNC-013)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista as atividades mais recentes primeiro", async () => {
    renderTimeline();

    await waitFor(() => expect(screen.getByText("Aula recente")).toBeInTheDocument());
    expect(screen.getByText("Curso antigo")).toBeInTheDocument();
  });

  it("filtra por periodo de 7 dias", async () => {
    renderTimeline();

    await waitFor(() => expect(screen.getByText("Aula recente")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));

    expect(screen.getByText("Aula recente")).toBeInTheDocument();
    expect(screen.queryByText("Curso antigo")).not.toBeInTheDocument();
  });

  it("marca o periodo ativo e volta a mostrar tudo", async () => {
    renderTimeline();

    await waitFor(() => expect(screen.getByText("Aula recente")).toBeInTheDocument());

    const btn7 = screen.getByRole("button", { name: "7 dias" });
    fireEvent.click(btn7);
    expect(btn7).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Tudo" }));
    expect(screen.getByText("Curso antigo")).toBeInTheDocument();
  });

});
