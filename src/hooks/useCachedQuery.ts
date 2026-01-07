import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';

// Hook para buscar cursos com cache
export const useCourses = (filters?: { category?: string; level?: string }) => {
  return useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          categories (*)
        `)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook para buscar detalhes de um curso com cache
export const useCourseDetail = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          lessons (*)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

// Hook para buscar categorias com cache
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook para buscar trilhas de aprendizado com cache
export const useLearningPathsList = () => {
  return useQuery({
    queryKey: queryKeys.learningPaths.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_courses (
            course_id,
            order_index,
            courses (id, title, slug)
          )
        `)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook para buscar detalhes de uma trilha com cache
export const useLearningPathDetail = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.learningPaths.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_courses (
            course_id,
            order_index,
            courses (
              id, 
              title, 
              slug, 
              description, 
              thumbnail_url,
              duration_minutes,
              level,
              total_lessons
            )
          )
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

// Hook para buscar XP do usuário com cache
export const useUserXPCached = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.xp(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook para buscar conquistas do usuário com cache
export const useUserAchievementsCached = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.achievements(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook para buscar streak do usuário com cache
export const useUserStreakCached = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.streak(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook para buscar leaderboard com cache
export const useLeaderboardCached = (period?: string, limit = 50) => {
  return useQuery({
    queryKey: queryKeys.leaderboard.global(period),
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { p_limit: limit, p_period: period || 'all' });
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook para buscar notificações com cache
export const useNotificationsCached = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
