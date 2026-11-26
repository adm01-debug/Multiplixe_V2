import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Eye, Tag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/skeletons/PageSkeletons';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import EmptyState from '@/components/SimpleEmptyState';
import DynamicSEO from '@/components/seo/DynamicSEO';

const Playbooks = () => {
  const navigate = useNavigate();
    const { data: playbooks = [], isLoading } = usePlaybooks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(playbooks.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, [playbooks]);

  const filtered = useMemo(() => {
    return category === 'all' ? playbooks : playbooks.filter(p => p.category === category);
  }, [playbooks, category]);

  const results = useFuzzySearch(filtered, ['title', 'summary', 'tags', 'category'], search);

  return (
    <AppLayout
      seo={{
        title: "Sales Playbooks",
        description: "Biblioteca de scripts, objeções e processos de vendas para vendedores Promo Brindes.",
        url: "https://multiplixe-v2.vercel.app/playbooks",
      }}
      cabecalho={
        <PageHeader
          titulo="Sales Playbooks"
          subtitulo="Scripts, objeções e processos"
          icone={BookOpen}
          gradiente="from-blue-500 to-cyan-500"
        />
      }
      classeConteudo="space-y-6"
    >
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Buscar playbooks"
            placeholder="Buscar playbooks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Button
              key={c}
              variant={category === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(c)}
              className="rounded-full"
            >
              {c === 'all' ? 'Todas' : c}
            </Button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite" role="status">
          {isLoading ? 'Carregando playbooks' : `${results.length} playbook(s) encontrado(s)`}
        </p>

        {isLoading ? (
          <ListSkeleton count={6} />
        ) : results.length === 0 ? (
          <EmptyState icon={BookOpen} title="Nenhum playbook encontrado" description="Tente outra busca ou filtro." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(p => (
              <Card
                key={p.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/playbook/${p.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="capitalize">{p.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {p.view_count}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {p.summary && <p className="text-sm text-muted-foreground line-clamp-3">{p.summary}</p>}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.tags.slice(0, 3).map(t => (
                        <Badge key={t} variant="outline" className="text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </AppLayout>
  );
};

export default Playbooks;
