import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_ROUTES = [
  "/",
  "/auth",
  "/catalogo",
  "/trilhas",
  "/ranking",
  "/playbooks",
  "/biblioteca-videos",
  "/onboarding",
  "/avaliacoes",
];

const SITE_URL = "https://learn-flow-forge-37.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const [{ data: playbooks }, { data: courses }, { data: paths }, { data: videos }] = await Promise.all([
      supabase.from("playbooks").select("slug, updated_at").eq("is_published", true),
      supabase.from("courses").select("slug, updated_at").eq("is_published", true),
      supabase.from("learning_paths").select("slug, updated_at").eq("is_published", true),
      supabase.from("training_videos").select("id, updated_at").eq("is_published", true),
    ]);

    const now = new Date().toISOString();
    const urls: string[] = [];

    for (const path of STATIC_ROUTES) {
      urls.push(`<url><loc>${SITE_URL}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`);
    }
    for (const p of playbooks ?? []) {
      urls.push(`<url><loc>${SITE_URL}/playbook/${p.slug}</loc><lastmod>${p.updated_at}</lastmod><changefreq>monthly</changefreq></url>`);
    }
    for (const c of courses ?? []) {
      urls.push(`<url><loc>${SITE_URL}/curso/${c.slug}</loc><lastmod>${c.updated_at}</lastmod><changefreq>monthly</changefreq></url>`);
    }
    for (const lp of paths ?? []) {
      urls.push(`<url><loc>${SITE_URL}/trilhas/${lp.slug}</loc><lastmod>${lp.updated_at}</lastmod><changefreq>monthly</changefreq></url>`);
    }
    for (const v of videos ?? []) {
      urls.push(`<url><loc>${SITE_URL}/biblioteca-videos#${v.id}</loc><lastmod>${v.updated_at}</lastmod><changefreq>monthly</changefreq></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
