import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SmartRecommendation {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  level: string | null;
  instructor_name: string | null;
  total_lessons: number | null;
  category_id: string | null;
  is_featured: boolean | null;
  recommendation_reason: string;
}

export function useSmartRecommendations(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["smart-recommendations", user?.id, limit],
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      if (!user) return [] as SmartRecommendation[];
      const { data, error } = await supabase.rpc("get_smart_recommendations", {
        p_user_id: user.id,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as SmartRecommendation[];
    },
  });
}
