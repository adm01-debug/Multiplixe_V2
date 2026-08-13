import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Eye, Calendar, Tag, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePlaybook, useRegisterPlaybookView } from '@/hooks/usePlaybooks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DynamicSEO from '@/components/seo/DynamicSEO';
import PlaybookComments from '@/components/playbooks/PlaybookComments';
import PlaybookDetailSkeleton from '@/components/skeletons/PlaybookDetailSkeleton';

const PlaybookDetail = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: playbook, isLoading } = usePlaybook(slug);
  const registerView = useRegisterPlaybookView();
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    if (playbook?.id) registerView.mutate(playbook.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook?.id]);

  const handleSummarize = async () => {
    if (!playbook) return;
    setSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-playbook-summarize', {
        body: { content: playbook.content, title: playbook.title },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data?.summary ?? '');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar resumo';
      toast.error(msg);
    } finally {
      setSummarizing(false);
    }
  };

  if (isLoading) {
    return <PlaybookDetailSkeleton />;
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
      <DynamicSEO
        title={playbook.title}
        description={playbook.summary || `Playbook de vendas: ${playbook.title}`}
        url={`https://multiplixe.lovable.app/playbook/${playbook.slug}`}
        type="article"
      />
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
          <div className="pt-2">
            <Button onClick={handleSummarize} disabled={summarizing} variant="secondary" size="sm">
              {summarizing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resumindo...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Resumir com IA</>
              )}
            </Button>
          </div>
          {summary && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Resumo executivo
                </h2>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{playbook.content}</ReactMarkdown>
        </article>

        <PlaybookComments playbookId={playbook.id} />
      </main>
    </div>
  );
};

export default PlaybookDetail;
