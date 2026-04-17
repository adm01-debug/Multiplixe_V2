import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const AdminEngagementHeatmap = () => {
  const [matrix, setMatrix] = useState<number[][]>(Array.from({ length: 7 }, () => Array(24).fill(0)));
  const [loading, setLoading] = useState(true);
  const [max, setMax] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("audit_logs")
        .select("created_at")
        .gte("created_at", since.toISOString())
        .limit(10000);
      if (cancelled) return;
      const m = Array.from({ length: 7 }, () => Array(24).fill(0));
      let mx = 1;
      for (const row of data ?? []) {
        if (!row.created_at) continue;
        const d = new Date(row.created_at);
        const day = d.getDay();
        const hour = d.getHours();
        m[day][hour] += 1;
        if (m[day][hour] > mx) mx = m[day][hour];
      }
      setMatrix(m);
      setMax(mx);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const intensity = (n: number) => {
    if (n === 0) return "bg-muted/40";
    const pct = n / max;
    if (pct < 0.25) return "bg-primary/20";
    if (pct < 0.5) return "bg-primary/40";
    if (pct < 0.75) return "bg-primary/60";
    return "bg-primary/90";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" /> Engajamento (últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex items-center gap-1 mb-1 pl-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="w-4 text-[9px] text-muted-foreground text-center">{h % 3 === 0 ? h : ""}</span>
                ))}
              </div>
              {matrix.map((row, di) => (
                <div key={di} className="flex items-center gap-1 mb-0.5">
                  <span className="w-9 text-[10px] text-muted-foreground">{DAYS[di]}</span>
                  {row.map((v, hi) => (
                    <div
                      key={hi}
                      className={`w-4 h-4 rounded ${intensity(v)}`}
                      title={`${DAYS[di]} ${hi}h: ${v} eventos`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEngagementHeatmap;
