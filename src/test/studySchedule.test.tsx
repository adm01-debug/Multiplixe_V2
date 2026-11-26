import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format, setDate, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TooltipProvider } from "@/components/ui/tooltip";

const hoisted = vi.hoisted(() => {
  const user = { id: "user-1", email: "ana@promobrindes.com.br" };
  const rows: Array<Record<string, unknown>> = [];
  const insert = vi.fn(async (payload: Record<string, unknown>) => {
    rows.push({
      id: `row-${rows.length + 1}`,
      user_id: "user-1",
      completed: false,
      created_at: "2026-11-25T10:00:00Z",
      courses: null,
      ...payload,
    });
    return { error: null };
  });
  const update = vi.fn(() => ({ eq: async () => ({ error: null }) }));
  const remove = vi.fn(() => ({ eq: async () => ({ error: null }) }));

  const table = {
    select: () => {
      const result = { data: rows.map((row) => ({ ...row })), error: null };
      const chain: Record<string, unknown> = {};
      const passthrough = () => chain;
      chain.eq = passthrough;
      chain.order = passthrough;
      chain.then = (resolve: (value: typeof result) => unknown) => resolve(result);
      return chain;
    },
    insert,
    update,
    delete: remove,
  };

  return { user, rows, insert, update, remove, table };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: hoisted.user, loading: false }),
}));

vi.mock("@/hooks/useCachedQuery", () => ({
  useCourses: () => ({ data: [{ id: "course-1", title: "Curso de Vendas" }] }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => hoisted.table },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import StudyCalendar from "@/components/calendar/StudyCalendar";
import StudySchedulePanel from "@/components/calendar/StudySchedulePanel";

const renderWithProviders = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
};

const renderPanel = () => renderWithProviders(<StudySchedulePanel />);

beforeEach(() => {
  hoisted.rows.length = 0;
  hoisted.insert.mockClear();
  hoisted.update.mockClear();
  hoisted.remove.mockClear();
});

describe("StudyCalendar", () => {
  it("mostra o mês corrente, marca o dia com atividade e navega entre meses", () => {
    const month = startOfMonth(new Date());
    const withActivity = setDate(month, 12);
    const onMonthChange = vi.fn();
    const { container } = renderWithProviders(
      <StudyCalendar
        currentMonth={month}
        onMonthChange={onMonthChange}
        scheduleItems={[
          {
            id: "item-1",
            date: withActivity.toISOString(),
            type: "lesson",
            title: "Aula de Produto",
            completed: true,
          },
        ]}
      />,
    );

    expect(screen.getByText(format(month, "MMMM yyyy", { locale: ptBR }))).toBeTruthy();
    expect(screen.getByText("Aula")).toBeTruthy();
    expect(screen.getByText("Quiz")).toBeTruthy();
    expect(screen.getByText("Conquista")).toBeTruthy();

    const dayButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "12",
    );
    expect(dayButton).toBeTruthy();
    expect(dayButton!.querySelectorAll('div[class*="rounded-full"]')).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    const previous = onMonthChange.mock.calls[0][0] as Date;
    expect(previous.getMonth()).toBe(month.getMonth() === 0 ? 11 : month.getMonth() - 1);

    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(onMonthChange).toHaveBeenCalledTimes(2);
  });
});

describe("StudySchedulePanel", () => {
  it("mostra estado vazio e cria um bloco de estudo com data, hora e duração", async () => {
    renderPanel();

    expect(await screen.findByText(/Nenhum bloco de estudo agendado/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Agendar$/ }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Data"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.change(within(dialog).getByLabelText("Hora (opcional)"), {
      target: { value: "19:30" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Agendar estudo/ }));

    await waitFor(() => expect(hoisted.insert).toHaveBeenCalledTimes(1));
    expect(hoisted.insert.mock.calls[0][0]).toMatchObject({
      user_id: "user-1",
      course_id: null,
      scheduled_date: "2026-12-01",
      scheduled_time: "19:30:00",
      duration_minutes: 30,
    });

    expect(await screen.findByText("Estudo livre")).toBeTruthy();
    expect(screen.getByText("01 de dezembro")).toBeTruthy();
    expect(screen.getByText("19:30")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
  });

  it("marca o bloco como concluído e permite remover", async () => {
    hoisted.rows.push({
      id: "row-1",
      user_id: "user-1",
      course_id: "course-1",
      scheduled_date: "2026-12-01",
      scheduled_time: null,
      duration_minutes: 45,
      completed: false,
      created_at: "2026-11-25T10:00:00Z",
      courses: { title: "Curso de Vendas" },
    });

    renderPanel();

    const toggle = await screen.findByRole("button", {
      name: "Marcar Curso de Vendas em 01/12 como concluído",
    });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);

    await waitFor(() => expect(hoisted.update).toHaveBeenCalledTimes(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Remover agendamento de Curso de Vendas em 01/12" }),
    );

    await waitFor(() => expect(hoisted.remove).toHaveBeenCalledTimes(1));
  });
});