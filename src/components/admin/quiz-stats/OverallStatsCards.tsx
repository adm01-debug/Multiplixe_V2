import { Target, CheckCircle, TrendingUp, Users } from 'lucide-react';
import type { OverallStats } from './types';

interface Props {
  overallStats: OverallStats;
}

const OverallStatsCards = ({ overallStats }: Props) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
      { icon: Target, label: 'Total de Tentativas', value: overallStats.totalAttempts, color: 'text-blue-500' },
      { icon: CheckCircle, label: 'Aprovações', value: overallStats.totalPassed, color: 'text-green-500', valueClass: 'text-green-500' },
      { icon: TrendingUp, label: 'Média Geral', value: `${overallStats.averageScore}%`, color: 'text-amber-500' },
      { icon: Users, label: 'Taxa de Aprovação', value: `${overallStats.overallPassingRate}%`, color: 'text-purple-500' },
    ].map((item) => (
      <div key={item.label} className="p-4 rounded-xl bg-card/80 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <item.icon className={`h-5 w-5 ${item.color}`} />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
        <p className={`text-2xl font-bold ${item.valueClass || ''}`}>{item.value}</p>
      </div>
    ))}
  </div>
);

export default OverallStatsCards;
