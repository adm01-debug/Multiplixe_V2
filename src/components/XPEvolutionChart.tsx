import { useState } from 'react';
import { useXPHistory } from '@/hooks/useXPHistory';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, Zap } from 'lucide-react';

type ChartType = 'area' | 'bar';
type PeriodType = 7 | 14 | 30;

const XPEvolutionChart = () => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [period, setPeriod] = useState<PeriodType>(30);
  const { history, loading } = useXPHistory(period);

  const chartData = history.map(entry => ({
    ...entry,
    dateFormatted: format(parseISO(entry.date), 'dd/MM', { locale: ptBR }),
    dateFull: format(parseISO(entry.date), "dd 'de' MMMM", { locale: ptBR })
  }));

  const totalXPInPeriod = history.reduce((sum, entry) => sum + entry.daily_xp, 0);
  const avgXPPerDay = history.length > 0 ? Math.round(totalXPInPeriod / history.length) : 0;
  const maxDailyXP = Math.max(...history.map(e => e.daily_xp), 0);

  if (loading) {
    return (
      <div className="neon-card p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-[300px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { dateFull: string; daily_xp: number; cumulative_xp: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-1">{data.dateFull}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              XP ganho: <span className="font-bold text-emerald-500">{data.daily_xp}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              Total acumulado: <span className="font-bold text-primary">{data.cumulative_xp}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="neon-card p-6 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Evolução de XP</h3>
            <p className="text-sm text-muted-foreground">Últimos {period} dias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {([7, 14, 30] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                chartType === 'area'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Área
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Barras
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{totalXPInPeriod}</p>
          <p className="text-xs text-muted-foreground">XP no período</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{avgXPPerDay}</p>
          <p className="text-xs text-muted-foreground">Média diária</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{maxDailyXP}</p>
          <p className="text-xs text-muted-foreground">Recorde diário</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        {chartData.length === 0 || totalXPInPeriod === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhum XP ganho neste período</p>
            <p className="text-xs">Complete lições para ver seu progresso!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="dateFormatted"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative_xp"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorXP)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(150 100% 45%)" />
                    <stop offset="100%" stopColor="hsl(150 100% 35%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="dateFormatted"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="daily_xp"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default XPEvolutionChart;
