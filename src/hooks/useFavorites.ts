import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, course_id: courseId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (courseId: string) => {
      const key = ["favorites", user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Favorite[]>(key) ?? [];
      const optimistic: Favorite = {
        id: `optimistic-${courseId}`,
        user_id: user?.id ?? "",
        course_id: courseId,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Favorite[]>(key, [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["favorites", user?.id], ctx.previous);
      toast.error("Erro ao adicionar aos favoritos");
    },
    onSuccess: () => {
      toast.success("Curso adicionado aos favoritos! ⭐");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      if (error) throw error;
    },
    onMutate: async (courseId: string) => {
      const key = ["favorites", user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Favorite[]>(key) ?? [];
      queryClient.setQueryData<Favorite[]>(key, previous.filter((f) => f.course_id !== courseId));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["favorites", user?.id], ctx.previous);
      toast.error("Erro ao remover dos favoritos");
    },
    onSuccess: () => {
      toast.success("Curso removido dos favoritos");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  const toggleFavorite = async (courseId: string) => {
    const isFav = isFavorite(courseId);
    if (isFav) {
      await removeFavorite.mutateAsync(courseId);
    } else {
      await addFavorite.mutateAsync(courseId);
    }
  };

  const isFavorite = (courseId: string) => {
    return favorites.some((f) => f.course_id === courseId);
  };

  return {
    favorites,
    isLoading,
    error,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
    isFavorite,
    isTogglingFavorite: addFavorite.isPending || removeFavorite.isPending,
  };
}
