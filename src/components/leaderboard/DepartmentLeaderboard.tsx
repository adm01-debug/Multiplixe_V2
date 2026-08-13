import { useDepartmentLeaderboard, DepartmentRanking } from '@/hooks/useDepartmentLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RankBadge from '@/components/RankBadge';
import { Building2, Users, TrendingUp, Loader2 } from 'lucide-react';

interface DepartmentLeaderboardProps {
  limit?: number;
}

const DepartmentLeaderboard = ({ limit = 10 }: DepartmentLeaderboardProps) => {
  const { rankings, loading } = useDepartmentLeaderboard(limit);

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default:
        return 'bg-card/50 border-border/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Ranking por Departamento</h3>
          <p className="text-sm text-muted-foreground">Competição entre equipes</p>
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium text-foreground mb-1">Nenhum departamento ainda</h4>
          <p className="text-sm text-muted-foreground">
            Os usuários precisam configurar seus departamentos no perfil.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((dept) => (
            <div
              key={dept.department}
              className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                ${getRankBgClass(dept.rank)}
                hover:scale-[1.01]
              `}
            >
              {/* Rank Badge */}
              <div className="w-12 flex items-center justify-center">
                <RankBadge rank={dept.rank} size={dept.rank <= 3 ? 'md' : 'sm'} />
              </div>

              {/* Department Icon */}
              <div className={`
                p-3 rounded-xl
                ${dept.rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-amber-500' :
                  dept.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-slate-500' :
                  dept.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
                  'bg-gradient-to-br from-primary/20 to-accent/20'}
              `}>
                <Building2 className={`h-5 w-5 ${dept.rank <= 3 ? 'text-white' : 'text-primary'}`} />
              </div>

              {/* Department Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{dept.department}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {dept.member_count} {dept.member_count === 1 ? 'membro' : 'membros'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {Math.round(dept.avg_xp).toLocaleString()} XP médio
                  </span>
                </div>
              </div>

              {/* Total XP */}
              <div className="text-right">
                <p className="font-bold text-lg neon-text">{dept.total_xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentLeaderboard;
