import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface StudyScheduleRow {
  id: string;
  user_id: string;
  course_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  completed: boolean;
  created_at: string;
  courses: { title: string } | null;
}

export interface StudyScheduleInput {
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  course_id: string | null;
}

export const studyScheduleKey = (userId: string | null) => ["study-schedule", userId] as const;

export const useStudySchedule = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: studyScheduleKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<StudyScheduleRow[]> => {
      const { data, error } = await supabase
        .from("study_schedule")
        .select(
          "id, user_id, course_id, scheduled_date, scheduled_time, duration_minutes, completed, created_at, courses:course_id (title)"
        )
        .eq("user_id", userId!)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: true });

      if (error) throw error;
      return (data ?? []) as unknown as StudyScheduleRow[];
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: studyScheduleKey(userId) });
  }, [queryClient, userId]);

  const createSchedule = useMutation({
    mutationFn: async (input: StudyScheduleInput) => {
      if (!userId) throw new Error("Faça login para agendar seus estudos.");
      const { error } = await supabase.from("study_schedule").insert({
        user_id: userId,
        course_id: input.course_id,
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time,
        duration_minutes: input.duration_minutes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Bloco de estudo agendado");
    },
    onError: (error: Error) =>
      toast.error("Não foi possível agendar o estudo", { description: error.message }),
  });

  const updateCompleted = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("study_schedule")
        .update({ completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) =>
      toast.error("Não foi possível atualizar o agendamento", { description: error.message }),
  });

  const removeSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Agendamento removido");
    },
    onError: (error: Error) =>
      toast.error("Não foi possível remover o agendamento", { description: error.message }),
  });

  return {
    schedules,
    isLoading,
    createSchedule: createSchedule.mutateAsync,
    isSaving: createSchedule.isPending,
    setCompleted: (id: string, completed: boolean) => updateCompleted.mutate({ id, completed }),
    removeSchedule: (id: string) => removeSchedule.mutate(id),
  };
};