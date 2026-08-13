import { Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CourseQuizStat } from './types';

interface Props {
  stats: CourseQuizStat[];
}

const CourseStatsTable = ({ stats }: Props) => (
  <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Target className="h-5 w-5 text-primary" />Estatísticas por Curso
    </h3>
    {stats.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">Nenhuma tentativa de quiz registrada ainda.</p>
    ) : (
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.courseId} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium">{stat.courseTitle}</h4>
                <p className="text-sm text-muted-foreground">{stat.quizTitle}</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${stat.passingRate >= 70 ? 'text-green-500' : stat.passingRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {stat.passingRate}%
                </span>
                <p className="text-xs text-muted-foreground">taxa de aprovação</p>
              </div>
            </div>
            <Progress value={stat.passingRate} className="h-2 mb-3" />
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center"><p className="font-semibold">{stat.totalAttempts}</p><p className="text-xs text-muted-foreground">Tentativas</p></div>
              <div className="text-center"><p className="font-semibold text-green-500">{stat.passedAttempts}</p><p className="text-xs text-muted-foreground">Aprovados</p></div>
              <div className="text-center"><p className="font-semibold text-red-500">{stat.totalAttempts - stat.passedAttempts}</p><p className="text-xs text-muted-foreground">Reprovados</p></div>
              <div className="text-center"><p className="font-semibold">{stat.averageScore}%</p><p className="text-xs text-muted-foreground">Média</p></div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CourseStatsTable;
