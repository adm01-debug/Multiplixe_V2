import { BookOpen, Clock, Flame, GraduationCap, Trophy } from 'lucide-react';
import { PerformanceComparison, type ComparisonStat } from '@/components/analytics/PerformanceComparison';
import { usePerformanceComparison } from '@/hooks/usePerformanceComparison';
import { buildComparisonRows } from '@/lib/performanceComparison';
import { Skeleton } from '@/components/ui/skeleton';

const ICONS = {
  'XP total': Trophy,
  'Aulas concluídas': GraduationCap,
  'Cursos concluídos': BookOpen,
  'Horas de estudo': Clock,
  'Sequência atual': Flame,
} as const;

const PerformanceComparisonWidget = () => {
  const { metrics, loading } = usePerformanceComparison();

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!metrics) return null;

  const rows = buildComparisonRows(metrics);
  if (rows.length === 0) return null;

  const stats: ComparisonStat[] = rows.map((row) => ({
    ...row,
    icon: ICONS[row.label as keyof typeof ICONS] ?? Trophy,
  }));

  return (
    <div className="space-y-2">
      <PerformanceComparison stats={stats} />
      <p className="text-xs text-muted-foreground text-center">
        Comparado com {metrics.studentCount === 1 ? '1 aluno com atividade' : `${metrics.studentCount} alunos com atividade`} na plataforma.
      </p>
    </div>
  );
};

export default PerformanceComparisonWidget;