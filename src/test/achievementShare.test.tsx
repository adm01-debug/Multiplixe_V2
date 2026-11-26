import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AchievementsGrid from "@/components/AchievementsGrid";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
  },
}));

const achievements = [
  {
    id: "a1",
    slug: "primeira-aula",
    name: "Primeira Aula",
    description: "Conclua sua primeira aula",
    icon: "🎯",
    category: "progress",
    xp_reward: 50,
    requirement_type: "lessons_completed",
    requirement_value: 1,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "a2",
    slug: "maratona",
    name: "Maratona",
    description: "Assista 10 aulas",
    icon: "🔥",
    category: "progress",
    xp_reward: 200,
    requirement_type: "lessons_completed",
    requirement_value: 10,
    gradient: "from-amber-500 to-orange-500",
  },
];

const renderGrid = (unlockedId: string | null) =>
  render(
    <AchievementsGrid
      achievements={achievements}
      isUnlocked={(id) => id === unlockedId}
    />,
  );

describe("compartilhar conquista (FUNC-022)", () => {
  it("oferece compartilhar apenas para conquistas desbloqueadas", () => {
    renderGrid("a1");

    expect(
      screen.getByRole("button", { name: /compartilhar conquista Primeira Aula/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /compartilhar conquista Maratona/i }),
    ).not.toBeInTheDocument();
  });

  it("nao oferece compartilhar quando nenhuma conquista foi desbloqueada", () => {
    renderGrid(null);

    expect(
      screen.queryByRole("button", { name: /compartilhar conquista/i }),
    ).not.toBeInTheDocument();
  });

  it("abre o dialogo de compartilhamento com os dados da conquista", () => {
    renderGrid("a1");

    fireEvent.click(
      screen.getByRole("button", { name: /compartilhar conquista Primeira Aula/i }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Compartilhar Conquista")).toBeInTheDocument();
    expect(within(dialog).getByText("Conclua sua primeira aula")).toBeInTheDocument();
    expect(within(dialog).getByText("+50 XP")).toBeInTheDocument();
  });
});