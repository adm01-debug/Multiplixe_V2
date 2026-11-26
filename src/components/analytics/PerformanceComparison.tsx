import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ComparisonStat {
  label: string;
  userValue: number;
  averageValue: number;
  unit?: string;
  icon: React.ElementType;
  format?: (value: number) => string;
}

interface PerformanceComparisonProps {
  stats: ComparisonStat[];
  className?: string;
}

const PerformanceComparison = ({ stats, className }: PerformanceComparisonProps) => {
  const getPercentageDiff = (user: number, avg: number) => {
    if (avg === 0) return 0;
    return ((user - avg) / avg) * 100;
  };

  const getTrend = (diff: number) => {
    if (diff > 5) return { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (diff < -5) return { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" };
    return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" };
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Target className="w-4 h-4 text-primary" />
          </div>
          Comparativo de Desempenho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => {
          const diff = getPercentageDiff(stat.userValue, stat.averageValue);
          const trend = getTrend(diff);
          const TrendIcon = trend.icon;
          const Icon = stat.icon;
          const formatValue = stat.format || ((v: number) => v.toString());
                    const peak = Math.max(stat.userValue, stat.averageValue, 1);

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-muted">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", trend.bg, trend.color)}>
                    <TrendIcon className="w-3 h-3" />
                    {diff > 0 ? "+" : ""}{Math.round(diff)}%
                  </span>
                </div>
              </div>

              {/* Progress comparison */}
              <div className="relative">
                {/* User progress (on top) */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stat.userValue / peak) * 100, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  />
                  
                  {/* Average marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                    style={{
                      left: `${Math.min((stat.averageValue / peak) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">
                    Você: {formatValue(stat.userValue)}{stat.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Média: {formatValue(stat.averageValue)}{stat.unit}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Summary */}
        <div className="pt-4 mt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm">
            {stats.filter(s => getPercentageDiff(s.userValue, s.averageValue) > 5).length > stats.length / 2 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-medium">
                  Você está acima da média geral! Continue assim! 🎉
                </span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  Continue praticando para superar a média!
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { PerformanceComparison };
export type { ComparisonStat };
