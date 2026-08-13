import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Activity, Users, BookOpen, Award, Loader2 } from "lucide-react";

interface FunnelStep {
  label: string;
  count: number;
  icon: typeof Activity;
  gradient: string;
}

const fetchFunnel = async (): Promise<FunnelStep[]> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [visitsRes, signupsRes, lessonsRes, certsRes] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("user_id", { count: "exact", head: true })
      .eq("action", "telemetry.page_view")
      .gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase
      .from("user_lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", true)
      .gte("completed_at", since),
    supabase.from("certificates").select("id", { count: "exact", head: true }).gte("issued_at", since),
  ]);

  return [
    { label: "Visitas (30d)", count: visitsRes.count ?? 0, icon: Activity, gradient: "from-blue-500 to-cyan-500" },
    { label: "Cadastros", count: signupsRes.count ?? 0, icon: Users, gradient: "from-purple-500 to-pink-500" },
    { label: "Aulas concluídas", count: lessonsRes.count ?? 0, icon: BookOpen, gradient: "from-amber-500 to-orange-500" },
    { label: "Certificados", count: certsRes.count ?? 0, icon: Award, gradient: "from-emerald-500 to-teal-500" },
  ];
};

const AdminTelemetryWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-telemetry-funnel"],
    queryFn: fetchFunnel,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  const max = Math.max(...(data ?? []).map((s) => s.count), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Funil de conversão (últimos 30 dias)</h3>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((step) => {
          const Icon = step.icon;
          const pct = (step.count / max) * 100;
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{step.count.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${step.gradient} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AdminTelemetryWidget;
