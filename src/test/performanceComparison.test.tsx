import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildComparisonRows, mapPerformanceComparison } from "@/lib/performanceComparison";
import { PerformanceComparison } from "@/components/analytics/PerformanceComparison";
import { Trophy } from "lucide-react";

const rawRow = {
  xp_total: 2450,
  xp_average: 1800,
  lessons_completed: 12,
  lessons_average: 9,
  courses_completed: 3,
  courses_average: 2,
  hours_studied: "7.5",
  hours_average: "5.2",
  streak_current: 4,
  streak_average: "2.5",
  student_count: 18,
};

describe("comparativo de desempenho (FUNC-014)", () => {
  it("converte a linha do RPC em metricas e arredonda horas", () => {
    const metrics = mapPerformanceComparison(rawRow);
    expect(metrics).not.toBeNull();
    expect(metrics).toMatchObject({
      xpTotal: 2450,
      xpAverage: 1800,
      lessonsCompleted: 12,
      lessonsAverage: 9,
      hoursStudied: 7.5,
      hoursAverage: 5.2,
      streakCurrent: 4,
      streakAverage: 2.5,
      studentCount: 18,
    });
  });

  it("devolve nulo sem linha e zera valores invalidos", () => {
    expect(mapPerformanceComparison(null)).toBeNull();
    expect(mapPerformanceComparison(undefined)).toBeNull();
    const metrics = mapPerformanceComparison({ xp_total: "abc", student_count: 0 });
    expect(metrics?.xpTotal).toBe(0);
    expect(metrics?.studentCount).toBe(1);
  });

  it("esconde linhas em que nem o aluno nem a media tem numero", () => {
    const metrics = mapPerformanceComparison(rawRow)!;
    const labels = buildComparisonRows(metrics).map((row) => row.label);
    expect(labels).toEqual([
      "XP total",
      "Aulas concluídas",
      "Cursos concluídos",
      "Horas de estudo",
      "Sequência atual",
    ]);

    const zerado = mapPerformanceComparison({
      xp_total: 0,
      xp_average: 0,
      lessons_completed: 0,
      lessons_average: 3,
      courses_completed: 0,
      courses_average: 0,
      hours_studied: 0,
      hours_average: 0,
      streak_current: 0,
      streak_average: 0,
      student_count: 4,
    })!;
    expect(buildComparisonRows(zerado).map((row) => row.label)).toEqual(["Aulas concluídas"]);
  });

  it("mostra valor do aluno, media e diferenca no card", () => {
    const metrics = mapPerformanceComparison(rawRow)!;
    const stats = buildComparisonRows(metrics).map((row) => ({ ...row, icon: Trophy }));

    render(<PerformanceComparison stats={stats} />);

    expect(screen.getByText("Comparativo de Desempenho")).toBeInTheDocument();
    expect(screen.getByText(/Você: 2\.450/)).toBeInTheDocument();
    expect(screen.getByText(/Média: 1\.800/)).toBeInTheDocument();
    expect(screen.getByText("+36%")).toBeInTheDocument();
  });

  it("nao quebra quando aluno e media estao zerados", () => {
    render(
      <PerformanceComparison
        stats={[{ label: "Sequência atual", userValue: 0, averageValue: 0, icon: Trophy }]}
      />,
    );

    expect(screen.getByText(/Você: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Média: 0/)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});