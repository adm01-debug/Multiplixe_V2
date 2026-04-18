import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  duration_seconds: number;
  tags: string[];
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const videoKeys = {
  all: ['training-videos'] as const,
  list: (includeUnpublished = false) => ['training-videos', 'list', includeUnpublished] as const,
};

const VIDEO_LIST_COLUMNS =
  'id, title, description, video_url, thumbnail_url, category, duration_seconds, tags, view_count, is_published, created_at, updated_at';

export const useTrainingVideos = (includeUnpublished = false) => {
  return useQuery({
    queryKey: videoKeys.list(includeUnpublished),
    queryFn: async () => {
      let query = supabase
        .from('training_videos')
        .select(VIDEO_LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!includeUnpublished) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TrainingVideo[];
    },
  });
};

export const useUpdateVideoProgress = () => {
  return useMutation({
    mutationFn: async ({ videoId, watchedSeconds, completed }: { videoId: string; watchedSeconds: number; completed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('training_video_views').upsert({
        video_id: videoId,
        user_id: user.id,
        watched_seconds: watchedSeconds,
        completed,
      }, { onConflict: 'video_id,user_id' });
    },
  });
};

export const useSaveTrainingVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TrainingVideo> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from('training_videos').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('training_videos').insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: videoKeys.all });
      toast.success('Vídeo salvo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteTrainingVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('training_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: videoKeys.all });
      toast.success('Vídeo excluído');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
