import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, Eye, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div className="min-h-screen bg-background">
      <DynamicSEO
        title="Sales Playbooks"
        description="Biblioteca de scripts, objeções e processos de vendas para vendedores Promo Brindes."
        url="https://multiplixe.lovable.app/playbooks"
      />
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sales Playbooks</h1>
              <p className="text-sm text-muted-foreground">Scripts, objeções e processos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
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

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
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
      </main>
    </div>
  );
};

export default Playbooks;
