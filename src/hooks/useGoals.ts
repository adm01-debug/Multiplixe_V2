import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export type GoalType = "courses_month" | "hours_week" | "xp_day" | "lessons_week";

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const goalTypeLabels: Record<GoalType, string> = {
  courses_month: "Cursos por mês",
  hours_week: "Horas por semana",
  xp_day: "XP por dia",
  lessons_week: "Aulas por semana",
};

export const goalTypeIcons: Record<GoalType, string> = {
  courses_month: "🎓",
  hours_week: "⏰",
  xp_day: "⚡",
  lessons_week: "📚",
};

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: goals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
          // progresso real vem do banco (FUNC-012): recalcula antes de ler, assim metas
          // criadas depois de o aluno ja ter estudado aparecem com o valor correto
          const { error: recalcError } = await supabase.rpc("recalculate_user_goals");
          if (recalcError && recalcError.code !== "PGRST202") throw recalcError;
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  const activeGoals = goals.filter((g) => !g.completed && new Date(g.end_date) >= new Date());

  const createGoal = useMutation({
    mutationFn: async ({
      goalType,
      targetValue,
    }: {
      goalType: GoalType;
      targetValue: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (goalType) {
        case "courses_month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "hours_week":
        case "lessons_week":
          startDate = startOfWeek(now, { weekStartsOn: 0 });
          endDate = endOfWeek(now, { weekStartsOn: 0 });
          break;
        case "xp_day":
          startDate = now;
          endDate = now;
          break;
        default:
          startDate = now;
          endDate = now;
      }

      const { data, error } = await supabase
        .from("user_goals")
        .insert({
          user_id: user.id,
          goal_type: goalType,
          target_value: targetValue,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      toast.success("Meta criada! 🎯 Boa sorte!");
    },
    onError: () => {
      toast.error("Erro ao criar meta");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("user_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
      toast.success("Meta removida");
    },
    onError: () => {
      toast.error("Erro ao remover meta");
    },
  });

  return {
    goals,
    activeGoals,
    isLoading,
    error,
    createGoal: createGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    isCreating: createGoal.isPending,
  };
}
