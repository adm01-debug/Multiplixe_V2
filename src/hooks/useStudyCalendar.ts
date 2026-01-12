import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface ScheduleItem {
  id: string;
  date: string;
  type: "lesson" | "quiz" | "achievement";
  title: string;
  completed?: boolean;
}

export const useStudyCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const { data: scheduleItems = [], isLoading, refetch } = useQuery({
    queryKey: ["study-calendar", user?.id, format(currentMonth, "yyyy-MM")],
    enabled: !!user?.id,
    queryFn: async (): Promise<ScheduleItem[]> => {
      const items: ScheduleItem[] = [];

      // Get completed lessons in this month
      const { data: lessonProgress } = await supabase
        .from("user_lesson_progress")
        .select(`
          id,
          completed_at,
          is_completed,
          lessons:lesson_id (title)
        `)
        .eq("user_id", user!.id)
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString());

      lessonProgress?.forEach((lp: { id: string; completed_at: string | null; is_completed: boolean | null; lessons: { title: string } | null }) => {
        if (lp.completed_at) {
          items.push({
            id: lp.id,
            date: lp.completed_at,
            type: "lesson",
            title: lp.lessons?.title || "Aula concluída",
            completed: true,
          });
        }
      });

      // Get quiz attempts in this month
      const { data: quizAttempts } = await supabase
        .from("user_quiz_attempts")
        .select(`
          id,
          completed_at,
          passed,
          quizzes:quiz_id (title)
        `)
        .eq("user_id", user!.id)
        .gte("completed_at", start.toISOString())
        .lte("completed_at", end.toISOString());

      quizAttempts?.forEach((qa: { id: string; completed_at: string; passed: boolean; quizzes: { title: string } | null }) => {
        items.push({
          id: qa.id,
          date: qa.completed_at,
          type: "quiz",
          title: qa.quizzes?.title || "Quiz realizado",
          completed: qa.passed,
        });
      });

      // Get achievements unlocked this month
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select(`
          id,
          unlocked_at,
          achievements:achievement_id (name)
        `)
        .eq("user_id", user!.id)
        .gte("unlocked_at", start.toISOString())
        .lte("unlocked_at", end.toISOString());

      achievements?.forEach((ua: { id: string; unlocked_at: string; achievements: { name: string } | null }) => {
        items.push({
          id: ua.id,
          date: ua.unlocked_at,
          type: "achievement",
          title: ua.achievements?.name || "Conquista desbloqueada",
          completed: true,
        });
      });

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  const goToMonth = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  return {
    currentMonth,
    setCurrentMonth: goToMonth,
    goToToday,
    scheduleItems,
    isLoading,
    refetch,
  };
};
