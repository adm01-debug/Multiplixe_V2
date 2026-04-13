import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { DailyStats, PeriodFilter } from './types';

interface Props {
  dailyStats: DailyStats[];
  periodFilter: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
}

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px'
};

const EvolutionChart = ({ dailyStats, periodFilter, onPeriodChange }: Props) => (
  <div className="p-6 rounded-2xl bg-card/80 border border-border/50">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />Evolução dos Últimos {periodFilter} Dias
      </h3>
      <Tabs value={periodFilter.toString()} onValueChange={(v) => onPeriodChange(Number(v) as PeriodFilter)} className="w-auto">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="7" className="px-4">7 dias</TabsTrigger>
          <TabsTrigger value="30" className="px-4">30 dias</TabsTrigger>
          <TabsTrigger value="90" className="px-4">90 dias</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    {dailyStats.length === 0 || dailyStats.every(d => d.attempts === 0) ? (
      <p className="text-muted-foreground text-center py-8">Nenhum dado disponível para o período.</p>
    ) : (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Taxa de Aprovação (%)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="passingRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v}%`, 'Taxa de Aprovação']} />
                <Area type="monotone" dataKey="passingRate" stroke="hsl(var(--primary))" fill="url(#passingRateGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Tentativas por Dia</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="attempts" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} name="Tentativas" />
                <Line type="monotone" dataKey="passed" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} name="Aprovados" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(217 91% 60%)' }} />
              <span className="text-muted-foreground">Tentativas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
              <span className="text-muted-foreground">Aprovados</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default EvolutionChart;
