import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, CheckCircle2, Clock, Layers, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/SimpleEmptyState';
import DynamicSEO from '@/components/seo/DynamicSEO';
import FlashcardPlayer from '@/components/flashcards/FlashcardPlayer';
import { useFlashcardOverview, useFlashcardSession } from '@/hooks/useFlashcards';
import { describeDue } from '@/lib/flashcardSrs';
import { SITE_URL } from '@/lib/constants';

const TODOS = 'todos';

const Flashcards = () => {
  const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
  const { data: overview, isLoading } = useFlashcardOverview();
  const [courseId, setCourseId] = useState<string | null>(params.get('curso'));

  const session = useFlashcardSession(courseId);

  useEffect(() => {
    const doParam = params.get('curso');
    if (doParam !== courseId && doParam) setCourseId(doParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const decks = overview?.decks ?? [];
  const deckAtual = decks.find(deck => deck.course_id === courseId) ?? null;

  const trocarDeck = (valor: string) => {
    const novo = valor === TODOS ? null : valor;
    setCourseId(novo);
    session.reset();
    if (novo) setParams({ curso: novo });
    else setParams({});
  };

  return (
    <AppLayout
      seo={{
        title: "Flashcards de Revisão",
        description: "Revise o conteúdo dos cursos em cartões com repetição espaçada e ganhe XP.",
        url: `${SITE_URL}/flashcards`,
      }}
      cabecalho={
        <PageHeader
          titulo="Flashcards de Revisão"
          subtitulo="Repetição espaçada: revise no dia certo e fixe o conteúdo"
          icone={Brain}
          gradiente="from-violet-500 to-fuchsia-500"
        />
      }
      classeConteudo="space-y-6"
    >
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { titulo: 'Para revisar agora', valor: overview?.pendentes ?? 0, icon: Clock, cor: 'text-amber-500' },
            { titulo: 'Cartões novos', valor: overview?.novos ?? 0, icon: Sparkles, cor: 'text-violet-500' },
            { titulo: 'Já dominados', valor: overview?.dominados ?? 0, icon: Trophy, cor: 'text-emerald-500' },
            { titulo: 'Total do catálogo', valor: overview?.total ?? 0, icon: Layers, cor: 'text-primary' },
          ].map(item => (
            <Card key={item.titulo} className="border-border/60">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.cor}`} aria-hidden="true" />
                  {item.titulo}
                </div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{item.valor}</p>}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:w-72">
            <Select value={courseId ?? TODOS} onValueChange={trocarDeck}>
              <SelectTrigger aria-label="Filtrar por curso">
                <SelectValue placeholder="Todos os cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os cursos</SelectItem>
                {decks.map(deck => (
                  <SelectItem key={deck.course_id} value={deck.course_id}>
                    {deck.titulo} ({deck.pendentes}/{deck.total})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!session.started && (
            <Button onClick={session.start} disabled={session.loading || (overview?.pendentes ?? 0) === 0}>
              <Play className="h-4 w-4 mr-2" aria-hidden="true" />
              {session.loading ? 'Carregando...' : 'Começar revisão'}
            </Button>
          )}
          {session.started && (
            <Button variant="outline" onClick={session.reset}>
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Encerrar sessão
            </Button>
          )}
        </section>

        {session.started && session.current && (
          <FlashcardPlayer
            card={session.current}
            deckName={deckAtual?.titulo ?? null}
            position={session.progress}
            progressPercent={session.progressPercent}
            reviewing={session.reviewing}
            onGrade={session.review}
          />
        )}

        {session.finished && (
          <Card className="border-emerald-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                Sessão concluída
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{session.summary.revisados}</p>
                  <p className="text-xs text-muted-foreground">Revisados</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{session.summary.acertos}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{session.summary.dominados}</p>
                  <p className="text-xs text-muted-foreground">Dominados</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-2xl font-bold text-emerald-600">+{session.summary.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Os cartões que você acertou voltam em 1, 6 e depois em prazos cada vez maiores. Os que você errou voltam em 10 minutos.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={session.start}>Revisar mais cartões</Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Voltar ao painel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {session.empty && (
          <EmptyState
            icon={CheckCircle2}
            title="Nada para revisar agora"
            description="Você está em dia. Volte quando os próximos cartões vencerem — o sistema avisa a hora certa de revisar."
          />
        )}

        {!session.started && (
          <Card>
            <CardHeader>
              <CardTitle>Seus baralhos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : decks.length === 0 ? (
                <EmptyState icon={Brain} title="Nenhum flashcard publicado" description="Peça ao time de treinamento para criar cartões de revisão para os cursos." />
              ) : (
                decks.map(deck => (
                  <button
                    key={deck.course_id}
                    type="button"
                    onClick={() => trocarDeck(deck.course_id)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span>
                      <span className="font-medium">{deck.titulo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {deck.total} cartões · {deck.dominados} dominados
                      </span>
                    </span>
                    <Badge variant={deck.pendentes > 0 ? 'default' : 'secondary'}>
                      {deck.pendentes > 0 ? `${deck.pendentes} para revisar` : 'Em dia'}
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {session.lastResult && session.started && session.current && (
          <p className="text-xs text-muted-foreground">
            Último cartão agendado {describeDue(session.lastResult.due_at).toLowerCase()} · fator de facilidade {session.lastResult.ease_factor}.
          </p>
        )}
          </AppLayout>
  );
};

export default Flashcards;