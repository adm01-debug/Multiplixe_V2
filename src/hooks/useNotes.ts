import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Note {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  content: string;
  timestamp_seconds: number;
  created_at: string;
  updated_at: string;
}

export function useNotes(lessonId?: string, courseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notes", user?.id, lessonId],
    queryFn: async () => {
      if (!user || !lessonId) return [];
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .order("timestamp_seconds", { ascending: true });

      if (error) throw error;
      return data as Note[];
    },
    enabled: !!user && !!lessonId,
  });

  const addNote = useMutation({
    mutationFn: async ({
      content,
      timestampSeconds,
    }: {
      content: string;
      timestampSeconds: number;
    }) => {
      if (!user || !lessonId || !courseId) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("user_notes")
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          content,
          timestamp_seconds: timestampSeconds,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id, lessonId] });
      toast.success("Nota salva! 📝");
    },
    onError: () => {
      toast.error("Erro ao salvar nota");
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("user_notes")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id, lessonId] });
      toast.success("Nota atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar nota");
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("user_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id, lessonId] });
      toast.success("Nota excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir nota");
    },
  });

  return {
    notes,
    isLoading,
    error,
    addNote: addNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    isAdding: addNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
}

// Hook para buscar todas as notas de um curso
export function useCourseNotes(courseId?: string) {
  const { user } = useAuth();

  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course-notes", user?.id, courseId],
    queryFn: async () => {
      if (!user || !courseId) return [];
      const { data, error } = await supabase
        .from("user_notes")
        .select("*, lessons(title, order_index)")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!courseId,
  });

  return { notes, isLoading, error };
}
