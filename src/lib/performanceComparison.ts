export interface PerformanceMetrics {
  xpTotal: number;
  xpAverage: number;
  lessonsCompleted: number;
  lessonsAverage: number;
  coursesCompleted: number;
  coursesAverage: number;
  hoursStudied: number;
  hoursAverage: number;
  streakCurrent: number;
  streakAverage: number;
  studentCount: number;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapPerformanceComparison = (
  row: Record<string, unknown> | null | undefined,
): PerformanceMetrics | null => {
  if (!row) return null;
  return {
    xpTotal: Math.round(toNumber(row.xp_total)),
    xpAverage: Math.round(toNumber(row.xp_average)),
    lessonsCompleted: Math.round(toNumber(row.lessons_completed)),
    lessonsAverage: Math.round(toNumber(row.lessons_average)),
    coursesCompleted: Math.round(toNumber(row.courses_completed)),
    coursesAverage: Math.round(toNumber(row.courses_average)),
    hoursStudied: Math.round(toNumber(row.hours_studied) * 10) / 10,
    hoursAverage: Math.round(toNumber(row.hours_average) * 10) / 10,
    streakCurrent: Math.round(toNumber(row.streak_current)),
    streakAverage: Math.round(toNumber(row.streak_average) * 10) / 10,
    studentCount: Math.max(Math.round(toNumber(row.student_count)), 1),
  };
};

export interface PerformanceMetricRow {
  label: string;
  userValue: number;
  averageValue: number;
  unit?: string;
  format?: (value: number) => string;
}

const asInteger = (value: number) => value.toLocaleString('pt-BR');
const asHours = (value: number) => value.toLocaleString('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const buildComparisonRows = (metrics: PerformanceMetrics): PerformanceMetricRow[] => {
  const rows: PerformanceMetricRow[] = [
    {
      label: 'XP total',
      userValue: metrics.xpTotal,
      averageValue: metrics.xpAverage,
      format: asInteger,
    },
    {
      label: 'Aulas concluídas',
      userValue: metrics.lessonsCompleted,
      averageValue: metrics.lessonsAverage,
    },
    {
      label: 'Cursos concluídos',
      userValue: metrics.coursesCompleted,
      averageValue: metrics.coursesAverage,
    },
    {
      label: 'Horas de estudo',
      userValue: metrics.hoursStudied,
      averageValue: metrics.hoursAverage,
      unit: 'h',
      format: asHours,
    },
    {
      label: 'Sequência atual',
      userValue: metrics.streakCurrent,
      averageValue: metrics.streakAverage,
      unit: ' dias',
      format: asHours,
    },
  ];

  // Linhas em que ninguém tem número não ajudam quem está começando.
  return rows.filter((row) => row.userValue > 0 || row.averageValue > 0);
};