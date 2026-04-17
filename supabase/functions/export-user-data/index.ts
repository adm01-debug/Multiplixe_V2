import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const [profile, progress, certificates, achievements, notifications] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_course_progress").select("*").eq("user_id", userId),
      supabase.from("certificates").select("*").eq("user_id", userId),
      supabase.from("user_achievements").select("*, achievements(name,description,xp_reward)").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: userData.user.email,
      profile: profile.data,
      course_progress: progress.data ?? [],
      certificates: certificates.data ?? [],
      achievements: achievements.data ?? [],
      recent_notifications: notifications.data ?? [],
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="meus-dados-${userId}.json"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
