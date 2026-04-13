import { PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { CourseQuizStat } from './types';

interface Props {
  stats: CourseQuizStat[];
}

const performanceBuckets = (stats: CourseQuizStat[]) => {
  const filtered = stats.filter(s => s.totalAttempts >= 5);
  return [
    { name: 'Excelente (≥80%)', value: filtered.filter(s => s.passingRate >= 80).length, color: 'hsl(142 76% 36%)' },
    { name: 'Bom (70-79%)', value: filtered.filter(s => s.passingRate >= 70 && s.passingRate < 80).length, color: 'hsl(142 76% 50%)' },
    { name: 'Regular (50-69%)', value: filtered.filter(s => s.passingRate >= 50 && s.passingRate < 70).length, color: 'hsl(45 93% 47%)' },
    { name: 'Baixo (<50%)', value: filtered.filter(s => s.passingRate < 50).length, color: 'hsl(0 84% 60%)' },
  ].filter(d => d.value > 0);
};

const legendItems = [
  { label: 'Excelente (≥80%)', color: 'hsl(142 76% 36%)', bgClass: 'bg-green-500/10 border-green-500/30', textClass: 'text-green-600', threshold: 80, max: 101 },
  { label: 'Bom (70-79%)', color: 'hsl(142 76% 50%)', bgClass: 'bg-emerald-500/10 border-emerald-500/30', textClass: 'text-emerald-600', threshold: 70, max: 80 },
  { label: 'Regular (50-69%)', color: 'hsl(45 93% 47%)', bgClass: 'bg-amber-500/10 border-amber-500/30', textClass: 'text-amber-600', threshold: 50, max: 70 },
  { label: 'Baixo (<50%)', color: 'hsl(0 84% 60%)', bgClass: 'bg-destructive/10 border-destructive/30', textClass: 'text-destructive', threshold: 0, max: 50 },
];

const PerformanceDistribution = ({ stats }: Props) => {
  const data = performanceBuckets(stats);
  if (stats.filter(s => s.totalAttempts >= 5).length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-primary" />
        Distribuição de Desempenho dos Quizzes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-3">
            {legendItems.map((item) => {
              const count = stats.filter(s => s.totalAttempts >= 5 && s.passingRate >= item.threshold && s.passingRate < item.max).length;
              return (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bgClass} border`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`font-bold ${item.textClass}`}>{count} quizzes</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">* Apenas quizzes com 5 ou mais tentativas são considerados</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDistribution;
