import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface PlaybookComment {
  id: string;
  playbook_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
}

export function usePlaybookComments(playbookId: string | undefined) {
  return useQuery({
    queryKey: ["playbook-comments", playbookId],
    enabled: !!playbookId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_comments")
        .select("*")
        .eq("playbook_id", playbookId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      if (userIds.length === 0) return [] as PlaybookComment[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((c) => ({
        ...c,
        author_name: profileMap.get(c.user_id)?.full_name ?? null,
        author_avatar: profileMap.get(c.user_id)?.avatar_url ?? null,
      })) as PlaybookComment[];
    },
  });
}

export function useAddPlaybookComment(playbookId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!user || !playbookId) throw new Error("Não autenticado");
      const trimmed = content.trim();
      if (trimmed.length < 1) throw new Error("Comentário vazio");
      if (trimmed.length > 2000) throw new Error("Comentário muito longo (máx. 2000)");
      const { error } = await supabase.from("playbook_comments").insert({
        playbook_id: playbookId,
        user_id: user.id,
        content: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook-comments", playbookId] });
      toast.success("Comentário publicado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePlaybookComment(playbookId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!user) throw new Error("Não autenticado");
      const trimmed = content.trim();
      if (trimmed.length < 1) throw new Error("Comentário vazio");
      if (trimmed.length > 2000) throw new Error("Comentário muito longo (máx. 2000)");
      const { error } = await supabase
        .from("playbook_comments")
        .update({ content: trimmed })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook-comments", playbookId] });
      toast.success("Comentário atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlaybookComment(playbookId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("playbook_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook-comments", playbookId] });
      toast.success("Comentário removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
