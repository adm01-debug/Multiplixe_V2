import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CohortRow {
  weekStart: string;
  cohortSize: number;
  retention: number[];
}

const WEEKS = 4;

const AdminCohortRetention = () => {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - WEEKS * 7 * 2);
      const [{ data: profiles }, { data: activity }] = await Promise.all([
        supabase.from("profiles").select("user_id, created_at").gte("created_at", since.toISOString()),
        supabase.from("user_xp_history").select("user_id, created_at").gte("created_at", since.toISOString()).limit(10000),
      ]);
      if (cancelled) return;

      const cohorts = new Map<string, { size: number; users: Set<string>; weekStart: Date }>();
      for (const p of profiles ?? []) {
        const created = new Date(p.created_at);
        const weekStart = new Date(created);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        if (!cohorts.has(key)) cohorts.set(key, { size: 0, users: new Set(), weekStart });
        const c = cohorts.get(key)!;
        c.size += 1;
        c.users.add(p.user_id);
      }

      const result: CohortRow[] = [];
      const sorted = Array.from(cohorts.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-WEEKS);
      for (const [key, c] of sorted) {
        const retention: number[] = [];
        for (let w = 0; w < WEEKS; w++) {
          const start = new Date(c.weekStart);
          start.setDate(start.getDate() + w * 7);
          const end = new Date(start);
          end.setDate(end.getDate() + 7);
          const active = new Set<string>();
          for (const a of activity ?? []) {
            const d = new Date(a.created_at);
            if (d >= start && d < end && c.users.has(a.user_id)) active.add(a.user_id);
          }
          retention.push(c.size > 0 ? Math.round((active.size / c.size) * 100) : 0);
        }
        result.push({ weekStart: key, cohortSize: c.size, retention });
      }
      setRows(result);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const cellColor = (pct: number) => {
    if (pct >= 75) return "bg-emerald-500/80 text-white";
    if (pct >= 50) return "bg-emerald-500/50";
    if (pct >= 25) return "bg-emerald-500/25";
    if (pct > 0) return "bg-emerald-500/10";
    return "bg-muted/40 text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" /> Retenção por coorte (semanal)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem coortes recentes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-2">Coorte</th>
                  <th className="py-2 pr-2">Tamanho</th>
                  {Array.from({ length: WEEKS }, (_, i) => (
                    <th key={i} className="py-2 px-2 text-center">Sem {i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.weekStart} className="border-t border-border">
                    <td className="py-2 pr-2 font-medium">{r.weekStart}</td>
                    <td className="py-2 pr-2">{r.cohortSize}</td>
                    {r.retention.map((pct, i) => (
                      <td key={i} className="py-1 px-1">
                        <div className={`rounded text-center py-1 font-medium ${cellColor(pct)}`}>{pct}%</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCohortRetention;
