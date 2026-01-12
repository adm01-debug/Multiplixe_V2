import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PlatformStats {
  averageXP: number;
  averageCoursesCompleted: number;
  averageHoursStudied: number;
  totalUsers: number;
}

interface UserStats {
  totalXP: number;
  coursesCompleted: number;
  hoursStudied: number;
}

export const usePlatformComparison = () => {
  const { user } = useAuth();

  const { data: platformStats, isLoading: loadingPlatform } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      // Get average XP
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("total_xp");

      // Get average courses completed
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("user_id, completed_at")
        .not("completed_at", "is", null);

      // Calculate averages
      const totalXP = xpData?.reduce((sum, row) => sum + (row.total_xp || 0), 0) || 0;
      const totalUsers = xpData?.length || 1;
      const averageXP = totalXP / totalUsers;

      // Count completed courses per user
      const userCompletions: Record<string, number> = {};
      progressData?.forEach((row) => {
        userCompletions[row.user_id] = (userCompletions[row.user_id] || 0) + 1;
      });
      const completedUsers = Object.keys(userCompletions).length || 1;
      const totalCompletions = Object.values(userCompletions).reduce((sum, count) => sum + count, 0);
      const averageCoursesCompleted = totalCompletions / completedUsers;

      // Estimate hours studied (assuming 1 XP = 0.5 minutes of study)
      const averageHoursStudied = (averageXP * 0.5) / 60;

      return {
        averageXP: Math.round(averageXP),
        averageCoursesCompleted: Math.round(averageCoursesCompleted * 10) / 10,
        averageHoursStudied: Math.round(averageHoursStudied * 10) / 10,
        totalUsers,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: userStats, isLoading: loadingUser } = useQuery({
    queryKey: ["user-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UserStats> => {
      // Get user's XP
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("total_xp")
        .eq("user_id", user!.id)
        .single();

      // Get user's completed courses
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("id")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null);

      const totalXP = xpData?.total_xp || 0;
      const coursesCompleted = progressData?.length || 0;
      const hoursStudied = (totalXP * 0.5) / 60;

      return {
        totalXP,
        coursesCompleted,
        hoursStudied: Math.round(hoursStudied * 10) / 10,
      };
    },
  });

  const getComparisonData = () => {
    if (!platformStats || !userStats) return null;

    return {
      xp: {
        user: userStats.totalXP,
        average: platformStats.averageXP,
        percentageDiff: platformStats.averageXP > 0
          ? ((userStats.totalXP - platformStats.averageXP) / platformStats.averageXP) * 100
          : 0,
      },
      courses: {
        user: userStats.coursesCompleted,
        average: platformStats.averageCoursesCompleted,
        percentageDiff: platformStats.averageCoursesCompleted > 0
          ? ((userStats.coursesCompleted - platformStats.averageCoursesCompleted) / platformStats.averageCoursesCompleted) * 100
          : 0,
      },
      hours: {
        user: userStats.hoursStudied,
        average: platformStats.averageHoursStudied,
        percentageDiff: platformStats.averageHoursStudied > 0
          ? ((userStats.hoursStudied - platformStats.averageHoursStudied) / platformStats.averageHoursStudied) * 100
          : 0,
      },
    };
  };

  return {
    platformStats,
    userStats,
    comparisonData: getComparisonData(),
    isLoading: loadingPlatform || loadingUser,
  };
};
