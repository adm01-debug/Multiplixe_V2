import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Users, Sparkles } from 'lucide-react';
import { useUserXP } from '@/hooks/useUserXP';
import { useXPHistory } from '@/hooks/useXPHistory';
import { useDepartmentLeaderboard } from '@/hooks/useDepartmentLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

/**
 * Painel de impacto pessoal: horas estudadas, sparkline de XP,
 * top categorias e comparação com média do departamento.
 * Reusa hooks existentes — sem novas tabelas.
 */
const PersonalImpactWidget = () => {
  const { user } = useAuth();
  const { userXP, totalXP } = useUserXP();
  const { history, loading: loadingHistory } = useXPHistory(30);
  const { rankings } = useDepartmentLeaderboard(50);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [topCategories, setTopCategories] = useState<{ name: string; minutes: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('department').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('user_lesson_progress')
          .select('watched_seconds, lessons!inner(course_id, courses!inner(category_id, categories(name)))')
          .eq('user_id', user.id),
      ]);
      setUserDepartment(profileRes.data?.department ?? null);

      const byCategory = new Map<string, number>();
      type Row = { watched_seconds: number | null; lessons: { courses: { categories: { name: string } | null } | null } | null };
      (progressRes.data as Row[] | null)?.forEach((row) => {
        const name = row.lessons?.courses?.categories?.name;
        if (!name) return;
        const minutes = Math.round((row.watched_seconds ?? 0) / 60);
        byCategory.set(name, (byCategory.get(name) ?? 0) + minutes);
      });
      const top = Array.from(byCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, minutes]) => ({ name, minutes }));
      setTopCategories(top);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const xpWeek = history
      .filter((h) => now - new Date(h.date).getTime() <= weekMs)
      .reduce((sum, h) => sum + h.daily_xp, 0);
    const xpMonth = history.reduce((sum, h) => sum + h.daily_xp, 0);

    // Estimativa: 25 XP por aula = ~10 min de aula
    const minutesWeek = Math.round((xpWeek / 25) * 10);
    const minutesMonth = Math.round((xpMonth / 25) * 10);

    return { xpWeek, xpMonth, minutesWeek, minutesMonth };
  }, [history]);

  const sparkline = useMemo(() => {
    if (history.length === 0) return { points: '', max: 0 };
    const last14 = history.slice(-14);
    const max = Math.max(...last14.map((h) => h.daily_xp), 1);
    const w = 200;
    const h = 50;
    const step = w / Math.max(last14.length - 1, 1);
    const points = last14
      .map((entry, i) => {
        const x = i * step;
        const y = h - (entry.daily_xp / max) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { points, max };
  }, [history]);

  const departmentComparison = useMemo(() => {
    if (!userDepartment || rankings.length === 0) return null;
    const dept = rankings.find((r) => r.department === userDepartment);
    if (!dept) return null;
    const diff = totalXP - dept.avg_xp;
    const pct = dept.avg_xp > 0 ? Math.round((diff / dept.avg_xp) * 100) : 0;
    return { avg: Math.round(dept.avg_xp), diff: Math.round(diff), pct };
  }, [userDepartment, rankings, totalXP]);

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-display font-bold text-foreground">Seu Impacto</h3>
          <p className="text-sm text-muted-foreground">Visão consolidada do seu progresso recente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Horas semana/mês */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Tempo estudado</span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-2xl font-display font-bold text-foreground">
                {Math.floor(stats.minutesWeek / 60)}h {stats.minutesWeek % 60}m
              </span>
              <span className="text-xs text-muted-foreground ml-2">esta semana</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.floor(stats.minutesMonth / 60)}h totais no mês
            </div>
          </div>
        </motion.div>

        {/* Sparkline XP */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">XP recente</span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-2xl font-display font-bold text-foreground">{stats.xpWeek}</span>
              <span className="text-xs text-muted-foreground ml-2">XP / 7d</span>
            </div>
            {!loadingHistory && sparkline.points ? (
              <svg viewBox="0 0 200 50" className="w-full h-10" aria-label="Evolução de XP nos últimos 14 dias">
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparkline.points}
                />
              </svg>
            ) : (
              <div className="h-10 rounded bg-muted/30 animate-pulse" />
            )}
          </div>
        </motion.div>

        {/* Top categorias */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Top categorias</span>
          </div>
          {topCategories.length > 0 ? (
            <ol className="space-y-1.5 text-sm">
              {topCategories.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between gap-2">
                  <span className="text-foreground truncate">
                    <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{c.minutes}min</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">Comece a estudar para ver suas categorias favoritas.</p>
          )}
        </motion.div>

        {/* Comparação departamento */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl bg-card/80 border border-border/50 neon-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">vs. departamento</span>
          </div>
          {departmentComparison ? (
            <div className="space-y-1">
              <div className={`text-2xl font-display font-bold ${departmentComparison.diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {departmentComparison.diff >= 0 ? '+' : ''}
                {departmentComparison.pct}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média do {userDepartment}: {departmentComparison.avg} XP
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {userDepartment
                ? 'Calculando comparação…'
                : 'Defina seu departamento no perfil para comparar.'}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PersonalImpactWidget;
