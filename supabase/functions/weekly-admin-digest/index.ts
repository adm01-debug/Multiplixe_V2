// Weekly Admin Digest — agrega KPIs dos últimos 7 dias e envia por e-mail aos admins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DigestPayload {
  dryRun?: boolean;
}

const fmtNum = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.max(0, Math.round(n)));

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);

interface DigestStats {
  newUsers: number;
  totalXP: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  topCourses: Array<{ title: string; completions: number }>;
  brokenStreaks: number;
  periodStart: Date;
  periodEnd: Date;
}

const renderHtml = (stats: DigestStats) => {
  const topCoursesHtml = stats.topCourses.length
    ? stats.topCourses
        .map(
          (c, i) => `
        <tr>
          <td style="padding:12px 8px;color:#94a3b8;font-weight:600;">#${i + 1}</td>
          <td style="padding:12px 8px;color:#f1f5f9;">${c.title}</td>
          <td style="padding:12px 8px;color:#a78bfa;text-align:right;font-weight:600;">${fmtNum(c.completions)}</td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" style="padding:16px;color:#94a3b8;text-align:center;">Nenhum curso concluído nesta semana.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Digest Semanal — Promo Brindes Academy</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(99,102,241,0.15);">
        <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">📊 Digest Semanal</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Promo Brindes Academy · ${fmtDate(stats.periodStart)} → ${fmtDate(stats.periodEnd)}</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="50%" style="padding:8px;">
                <div style="background:#0f172a;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Novos usuários</p>
                  <p style="margin:8px 0 0;color:#a78bfa;font-size:32px;font-weight:700;">${fmtNum(stats.newUsers)}</p>
                </div>
              </td>
              <td width="50%" style="padding:8px;">
                <div style="background:#0f172a;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">XP distribuído</p>
                  <p style="margin:8px 0 0;color:#34d399;font-size:32px;font-weight:700;">${fmtNum(stats.totalXP)}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:8px;">
                <div style="background:#0f172a;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Aulas concluídas</p>
                  <p style="margin:8px 0 0;color:#f1f5f9;font-size:32px;font-weight:700;">${fmtNum(stats.lessonsCompleted)}</p>
                </div>
              </td>
              <td width="50%" style="padding:8px;">
                <div style="background:#0f172a;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cursos concluídos</p>
                  <p style="margin:8px 0 0;color:#fbbf24;font-size:32px;font-weight:700;">${fmtNum(stats.coursesCompleted)}</p>
                </div>
              </td>
            </tr>
          </table>

          <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;">🏆 Top 5 cursos da semana</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
            ${topCoursesHtml}
          </table>

          ${
            stats.brokenStreaks > 0
              ? `<div style="margin-top:24px;padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;">
                  <p style="margin:0;color:#fca5a5;font-size:14px;"><strong>⚠️ Atenção:</strong> ${fmtNum(stats.brokenStreaks)} usuário(s) quebraram a ofensiva nos últimos dias.</p>
                </div>`
              : ""
          }
        </td></tr>

        <tr><td style="padding:24px 32px;background:#0f172a;text-align:center;border-top:1px solid rgba(99,102,241,0.2);">
          <p style="margin:0;color:#64748b;font-size:12px;">Promo Brindes Academy · Relatório automático semanal</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

async function collectStats(supabase: ReturnType<typeof createClient>): Promise<DigestStats> {
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const startIso = periodStart.toISOString();
  const streakCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [newUsersRes, xpRes, lessonsRes, coursesRes, streakRes, allCoursesRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startIso),
      supabase.from("user_xp_history").select("xp_amount").gte("created_at", startIso),
      supabase.from("user_lesson_progress").select("id", { count: "exact", head: true }).eq("is_completed", true).gte("completed_at", startIso),
      supabase.from("user_course_progress").select("course_id").eq("progress_percentage", 100).gte("updated_at", startIso),
      supabase.from("user_streaks").select("user_id", { count: "exact", head: true }).lt("last_activity_date", streakCutoff).gt("current_streak", 0),
      supabase.from("courses").select("id, title"),
    ]);

  const totalXP = ((xpRes.data ?? []) as Array<{ xp_amount: number }>).reduce(
    (sum, r) => sum + (r.xp_amount ?? 0),
    0,
  );

  const courseCounts = new Map<string, number>();
  ((coursesRes.data ?? []) as Array<{ course_id: string }>).forEach((r) => {
    courseCounts.set(r.course_id, (courseCounts.get(r.course_id) ?? 0) + 1);
  });
  const courseTitles = new Map(
    ((allCoursesRes.data ?? []) as Array<{ id: string; title: string }>).map((c) => [c.id, c.title]),
  );
  const topCourses = [...courseCounts.entries()]
    .map(([id, completions]) => ({ title: courseTitles.get(id) ?? "Curso", completions }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

  return {
    newUsers: newUsersRes.count ?? 0,
    totalXP,
    lessonsCompleted: lessonsRes.count ?? 0,
    coursesCompleted: ((coursesRes.data ?? []) as unknown[]).length,
    topCourses,
    brokenStreaks: streakRes.count ?? 0,
    periodStart,
    periodEnd,
  };
}

async function getAdminEmails(
  supabase: ReturnType<typeof createClient>,
): Promise<Array<{ email: string; name: string | null }>> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!roles?.length) return [];

  const ids = (roles as Array<{ user_id: string }>).map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", ids);

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ user_id: string; full_name: string | null }>).map((p) => [
      p.user_id,
      p.full_name,
    ]),
  );

  const results: Array<{ email: string; name: string | null }> = [];
  for (const id of ids) {
    const { data } = await supabase.auth.admin.getUserById(id);
    const email = data?.user?.email;
    if (email) results.push({ email, name: profileMap.get(id) ?? null });
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let payload: DigestPayload = {};
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body && typeof body === "object" && "dryRun" in body) {
          payload.dryRun = Boolean((body as { dryRun?: unknown }).dryRun);
        }
      } catch {
        // empty body is fine
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const stats = await collectStats(supabase);
    const html = renderHtml(stats);
    const subject = `📊 Digest Semanal Academy — ${fmtDate(stats.periodStart)}`;

    if (payload.dryRun) {
      return new Response(
        JSON.stringify({ ok: true, dryRun: true, stats, preview: html.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admins = await getAdminEmails(supabase);
    if (!admins.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: "no_admins" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    const failures: string[] = [];
    for (const admin of admins) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Promo Brindes Academy <onboarding@resend.dev>",
            to: [admin.email],
            subject,
            html,
          }),
        });
        if (res.ok) sent++;
        else failures.push(`${admin.email}: HTTP ${res.status}`);
      } catch (err) {
        failures.push(`${admin.email}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, total: admins.length, failures }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
