import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AchievementsGrid from "@/components/AchievementsGrid";
import { estadoDaJanela, rotuloDaJanela } from "@/lib/achievementSeason";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
  },
}));

const AGORA = new Date("2026-12-15T12:00:00.000Z");

describe("achievementSeason", () => {
  it("conquista sem janela nem evento é permanente", () => {
    expect(estadoDaJanela({}, AGORA)).toBe("permanente");
    expect(rotuloDaJanela({}, AGORA)).toBeNull();
  });

  it("evento sem datas próprias usa o prazo do evento", () => {
    expect(estadoDaJanela({ seasonal_event_id: "ev-1" }, AGORA)).toBe("evento");
    expect(rotuloDaJanela({ seasonal_event_id: "ev-1" }, AGORA)).toBe("Sazonal · prazo do evento");
  });

  it("distingue aguardando, disponível e encerrada", () => {
    const futura = { starts_at: "2027-01-01T00:00:00.000Z", ends_at: "2027-01-31T00:00:00.000Z" };
    const vigente = { starts_at: "2026-12-01T00:00:00.000Z", ends_at: "2026-12-31T00:00:00.000Z" };
    const vencida = { starts_at: "2026-11-01T00:00:00.000Z", ends_at: "2026-11-30T00:00:00.000Z" };

    expect(estadoDaJanela(futura, AGORA)).toBe("aguardando");
    expect(estadoDaJanela(vigente, AGORA)).toBe("disponivel");
    expect(estadoDaJanela(vencida, AGORA)).toBe("encerrada");
    expect(rotuloDaJanela(futura, AGORA)).toMatch(/^Sazonal · a partir de /);
    expect(rotuloDaJanela(vigente, AGORA)).toMatch(/^Sazonal · até /);
    expect(rotuloDaJanela(vencida, AGORA)).toMatch(/^Encerrada em /);
  });

  it("data inválida não quebra o cálculo", () => {
    expect(estadoDaJanela({ starts_at: "nao-e-data" }, AGORA)).toBe("permanente");
  });
});

const conquista = (overrides: Record<string, unknown>) => ({
  id: "ach-1",
  slug: "primeira-aula",
  name: "Primeira Aula",
  description: "Conclua sua primeira aula",
  icon: "🎯",
  category: "progress",
  xp_reward: 50,
  requirement_type: "lessons_completed",
  requirement_value: 1,
  gradient: "from-blue-500 to-cyan-500",
  ...overrides,
});

describe("AchievementsGrid com conquistas sazonais", () => {
  it("mostra o selo da janela e oculta conquista permanente", () => {
    render(
      <AchievementsGrid
        achievements={[
          conquista({ id: "a1", name: "Primeira Aula" }),
          conquista({
            id: "a2",
            slug: "natal-solidario",
            name: "Natal Solidário",
            starts_at: "2020-12-01T00:00:00.000Z",
            ends_at: "2020-12-31T00:00:00.000Z",
          }),
        ]}
        isUnlocked={() => false}
      />,
    );

    expect(screen.getByText("Primeira Aula")).toBeInTheDocument();
    expect(screen.getByText("Natal Solidário")).toBeInTheDocument();
    expect(screen.getByText(/^Encerrada em /)).toBeInTheDocument();
  });
});