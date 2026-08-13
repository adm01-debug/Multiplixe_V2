import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, Loader2 } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';

interface VideoEngagement {
  id: string;
  title: string;
  view_count: number;
  completion_rate: number;
}

const AdminVideoEngagementWidget = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'video-engagement'],
    queryFn: async () => {
      const { data: videos, error } = await supabase
        .from('training_videos')
        .select('id, title, view_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);
      if (error) throw error;

      const ids = (videos || []).map(v => v.id);
      if (ids.length === 0) return [] as VideoEngagement[];

      const { data: views } = await supabase
        .from('training_video_views')
        .select('video_id, completed')
        .in('video_id', ids);

      const stats = new Map<string, { total: number; completed: number }>();
      (views || []).forEach(v => {
        const s = stats.get(v.video_id) || { total: 0, completed: 0 };
        s.total += 1;
        if (v.completed) s.completed += 1;
        stats.set(v.video_id, s);
      });

      return (videos || []).map(v => {
        const s = stats.get(v.id);
        const rate = s && s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return { id: v.id, title: v.title, view_count: v.view_count, completion_rate: rate };
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4 text-primary" aria-hidden="true" />
          Engajamento de Vídeos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Carregando" />
          </div>
        ) : data.length === 0 ? (
          <SimpleEmptyState icon={Video} title="Sem dados" description="Publique vídeos para ver engajamento." />
        ) : (
          <ul className="space-y-3" aria-label="Taxa de conclusão dos vídeos">
            {data.map(v => (
              <li key={v.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate flex-1">{v.title}</p>
                  <span className="text-xs text-muted-foreground tabular-nums">{v.completion_rate}%</span>
                </div>
                <Progress value={v.completion_rate} className="h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminVideoEngagementWidget;
