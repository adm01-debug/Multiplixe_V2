import { motion } from "framer-motion";
import { Users, Trophy, TrendingUp, Medal, Crown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDepartmentLeaderboard } from "@/hooks/useDepartmentLeaderboard";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentRankingProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

const DepartmentRanking = ({
  limit = 5,
  showTitle = true,
  className = "",
}: DepartmentRankingProps) => {
  const { rankings, loading: isLoading } = useDepartmentLeaderboard(limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/50";
      case 2:
        return "bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/50";
      case 3:
        return "bg-gradient-to-r from-amber-700/20 to-orange-600/10 border-amber-700/50";
      default:
        return "bg-muted/30 border-border/50";
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ranking por Departamento
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ranking por Departamento
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum departamento encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking por Departamento
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {rankings.map((dept, index) => (
          <motion.div
            key={dept.department}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-xl border ${getRankBg(dept.rank)}`}
          >
            {/* Rank Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
              {getRankIcon(dept.rank)}
            </div>

            {/* Department Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground truncate">
                  {dept.department}
                </p>
                {dept.rank === 1 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs">
                    Líder
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {dept.member_count} {dept.member_count === 1 ? "membro" : "membros"}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {Math.round(dept.avg_xp)} XP/membro
                </span>
              </div>
            </div>

            {/* Total XP */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-bold text-primary">
                <Zap className="h-4 w-4" />
                {dept.total_xp.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DepartmentRanking;
