import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Eye, Loader2 } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';

interface TopPlaybook {
  id: string;
  title: string;
  category: string;
  view_count: number;
  slug: string;
}

const AdminTopPlaybooksWidget = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'top-playbooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbooks')
        .select('id, title, category, view_count, slug')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as TopPlaybook[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          Top Playbooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Carregando" />
          </div>
        ) : data.length === 0 ? (
          <SimpleEmptyState icon={BookOpen} title="Sem dados" description="Nenhum playbook visualizado ainda." />
        ) : (
          <ul className="space-y-2" aria-label="Playbooks mais lidos">
            {data.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  {p.view_count}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTopPlaybooksWidget;
