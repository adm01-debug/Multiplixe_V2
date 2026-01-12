import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RecommendedCourse {
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

export function useRecommendations(limit: number = 6) {
  const { user } = useAuth();

  const {
    data: recommendations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_recommended_courses", {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (error) {
        console.error("Error fetching recommendations:", error);
        // Fallback: fetch popular courses
        const { data: fallbackData } = await supabase
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(limit);

        return (fallbackData || []).map((course) => ({
          ...course,
          recommendation_reason: course.is_featured ? "Em destaque" : "Sugestão para você",
        })) as RecommendedCourse[];
      }

      return data as RecommendedCourse[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    recommendations,
    isLoading,
    error,
    refetch,
  };
}
