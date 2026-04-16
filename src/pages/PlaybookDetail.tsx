import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Eye, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlaybook, useRegisterPlaybookView } from '@/hooks/usePlaybooks';

const PlaybookDetail = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: playbook, isLoading } = usePlaybook(slug);
  const registerView = useRegisterPlaybookView();

  useEffect(() => {
    if (playbook?.id) registerView.mutate(playbook.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Playbook não encontrado</h1>
        <Button onClick={() => navigate('/playbooks')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">Voltar aos playbooks</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{playbook.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" /> {playbook.view_count} visualizações
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {new Date(playbook.updated_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <h1 className="text-4xl font-bold">{playbook.title}</h1>
          {playbook.summary && <p className="text-lg text-muted-foreground">{playbook.summary}</p>}
          {playbook.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {playbook.tags.map(t => (
                <Badge key={t} variant="outline" className="text-xs">
                  <Tag className="h-2.5 w-2.5 mr-1" />{t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{playbook.content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
};

export default PlaybookDetail;
