import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const estado = vi.hoisted(() => ({ notifications: [] as unknown[] }));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: estado.notifications,
    unreadCount: estado.notifications.length,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  }),
}));

import NotificationBell from "@/components/NotificationBell";

const aviso = (type: string, title: string) => ({
  id: type,
  user_id: "u1",
  title,
  message: `mensagem ${type}`,
  type,
  is_read: false,
  action_url: null,
  created_at: new Date().toISOString(),
});

const abrir = () => {
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByLabelText(/Notifica/));
};

describe("avisos automaticos do banco na central de notificacoes", () => {
  beforeEach(() => {
    estado.notifications = [];
  });

  it("mostra o aviso de sequencia em risco com icone proprio", () => {
    estado.notifications = [aviso("streak_risk", "Sua sequencia esta em risco!")];
    abrir();

    expect(screen.getByText("Sua sequencia esta em risco!")).toBeInTheDocument();
    expect(document.querySelector(".text-orange-500")).not.toBeNull();
    expect(document.querySelector(".text-blue-500")).toBeNull();
  });

  it("mostra o aviso de avaliacao vencendo com icone proprio", () => {
    estado.notifications = [aviso("assessment_due", "Avaliacao proxima do vencimento")];
    abrir();

    expect(screen.getByText("Avaliacao proxima do vencimento")).toBeInTheDocument();
    expect(document.querySelector(".text-emerald-500")).not.toBeNull();
    expect(document.querySelector(".text-blue-500")).toBeNull();
  });

  it("usa o icone generico para tipo desconhecido", () => {
    estado.notifications = [aviso("info", "Aviso generico")];
    abrir();

    expect(document.querySelector(".text-blue-500")).not.toBeNull();
  });
});