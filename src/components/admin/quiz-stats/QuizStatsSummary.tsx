import { Target, CheckCircle, TrendingUp, Users, AlertTriangle, Award, Zap, Trophy, Activity } from 'lucide-react';
import type { CourseQuizStat, OverallStats } from './types';

interface Props {
  stats: CourseQuizStat[];
  overallStats: OverallStats;
}

const QuizStatsSummary = ({ stats, overallStats }: Props) => (
  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Activity className="h-5 w-5 text-primary" />
      Resumo Geral de Quizzes
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[
        { icon: Target, value: stats.length, label: 'Total de Quizzes', color: 'blue-500' },
        { icon: Users, value: overallStats.totalAttempts, label: 'Tentativas', color: 'purple-500' },
        { icon: CheckCircle, value: overallStats.totalPassed, label: 'Aprovações', color: 'green-500', valueClass: 'text-green-500' },
        { icon: TrendingUp, value: `${overallStats.overallPassingRate}%`, label: 'Taxa Aprovação', color: 'amber-500',
          valueClass: overallStats.overallPassingRate >= 70 ? 'text-green-500' : overallStats.overallPassingRate >= 50 ? 'text-amber-500' : 'text-destructive' },
        { icon: Award, value: `${overallStats.averageScore}%`, label: 'Média Geral', color: 'primary' },
        { icon: AlertTriangle, value: stats.filter(s => s.totalAttempts >= 5 && s.passingRate < 50).length, label: 'Baixo Desempenho', color: 'destructive',
          valueClass: stats.filter(s => s.totalAttempts >= 5 && s.passingRate < 50).length > 0 ? 'text-destructive' : 'text-green-500' },
      ].map((item, i) => (
        <div key={i} className="p-4 rounded-xl bg-card/80 border border-border/50 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className={`p-2 rounded-full bg-${item.color}/10`}>
              <item.icon className={`h-5 w-5 text-${item.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${item.valueClass || ''}`}>{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>

    <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              <span className="font-medium">Quiz mais tentado:</span>{' '}
              <span className="text-muted-foreground">
                {stats.length > 0 ? stats.reduce((a, b) => a.totalAttempts > b.totalAttempts ? a : b).quizTitle : 'N/A'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              <span className="font-medium">Melhor taxa:</span>{' '}
              <span className="text-muted-foreground">
                {stats.filter(s => s.totalAttempts >= 5).length > 0
                  ? `${stats.filter(s => s.totalAttempts >= 5).reduce((a, b) => a.passingRate > b.passingRate ? a : b).quizTitle} (${stats.filter(s => s.totalAttempts >= 5).reduce((a, b) => a.passingRate > b.passingRate ? a : b).passingRate}%)`
                  : 'N/A'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Usuários únicos:</span>
          <span className="font-medium text-foreground">{stats.reduce((sum, s) => sum + s.uniqueUsers, 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

export default QuizStatsSummary;
