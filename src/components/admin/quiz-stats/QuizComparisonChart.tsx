import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { CourseQuizStat } from './types';

interface Props {
  stats: CourseQuizStat[];
  selectedQuizId: string;
}

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px'
};

const QuizComparisonChart = ({ stats, selectedQuizId }: Props) => {
  if (stats.length <= 1 || selectedQuizId !== 'all') return null;
  const top10 = stats.slice(0, 10);

  return (
    <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />Comparativo entre Quizzes
      </h3>
      <div className="space-y-6">
        {/* Passing Rate */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Taxa de Aprovação por Quiz (%)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal vertical={false} />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="quizTitle" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120}
                  tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { passingRate: 'Taxa de Aprovação', averageScore: 'Média' };
                    return [`${value}%`, labels[name] || name];
                  }} />
                <Bar dataKey="passingRate" radius={[0, 4, 4, 0]}>
                  {top10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.passingRate >= 70 ? 'hsl(142 76% 36%)' : entry.passingRate >= 50 ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            {[{ color: 'hsl(142 76% 36%)', label: '≥70% (Bom)' }, { color: 'hsl(45 93% 47%)', label: '50-69% (Regular)' }, { color: 'hsl(0 84% 60%)', label: '<50% (Baixo)' }]
              .map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
          </div>
        </div>
        {/* Attempts Comparison */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Tentativas e Aprovações por Quiz</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal vertical={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis type="category" dataKey="quizTitle" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120}
                  tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Legend />
                <Bar dataKey="totalAttempts" name="Tentativas" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="passedAttempts" name="Aprovações" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Average Score */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Média de Pontuação por Quiz (%)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal vertical={false} />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="quizTitle" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120}
                  tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v}%`, 'Média']} />
                <Bar dataKey="averageScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizComparisonChart;
