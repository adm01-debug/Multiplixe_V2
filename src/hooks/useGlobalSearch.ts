import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GlobalSearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  type: "course" | "playbook" | "video" | "path";
  url: string;
};

export function useGlobalSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<GlobalSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const term = `%${trimmed}%`;
        const [coursesRes, playbooksRes, videosRes, pathsRes] = await Promise.all([
          supabase
            .from("courses")
            .select("id,title,description,slug")
            .eq("is_published", true)
            .ilike("title", term)
            .limit(5),
          supabase
            .from("playbooks")
            .select("id,title,summary,slug")
            .eq("is_published", true)
            .ilike("title", term)
            .limit(5),
          supabase
            .from("training_videos")
            .select("id,title,description")
            .eq("is_published", true)
            .ilike("title", term)
            .limit(5),
          supabase
            .from("learning_paths")
            .select("id,title,description,slug")
            .eq("is_published", true)
            .ilike("title", term)
            .limit(5),
        ]);

        const hits: GlobalSearchHit[] = [
          ...(coursesRes.data ?? []).map((c) => ({
            id: c.id,
            title: c.title,
            subtitle: c.description ?? undefined,
            type: "course" as const,
            url: `/curso/${c.slug}`,
          })),
          ...(playbooksRes.data ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.summary ?? undefined,
            type: "playbook" as const,
            url: `/playbook/${p.slug}`,
          })),
          ...(videosRes.data ?? []).map((v) => ({
            id: v.id,
            title: v.title,
            subtitle: v.description ?? undefined,
            type: "video" as const,
            url: `/biblioteca-videos`,
          })),
          ...(pathsRes.data ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.description ?? undefined,
            type: "path" as const,
            url: `/trilhas/${p.slug}`,
          })),
        ];
        setResults(hits);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, isLoading };
}
