import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Search, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTrainingVideos, useUpdateVideoProgress, type TrainingVideo } from '@/hooks/useTrainingVideos';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import EmptyState from '@/components/SimpleEmptyState';
import DynamicSEO from '@/components/seo/DynamicSEO';

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const VideoLibrary = () => {
  const navigate = useNavigate();
  const { data: videos = [], isLoading } = useTrainingVideos();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [active, setActive] = useState<TrainingVideo | null>(null);
  const updateProgress = useUpdateVideoProgress();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keyboard nav no modal: setas controlam tempo, espaço pausa
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(v.currentTime + 5, v.duration || v.currentTime + 5); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); v.currentTime = Math.max(v.currentTime - 5, 0); }
      else if (e.key === ' ') { e.preventDefault(); if (v.paused) void v.play(); else v.pause(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);

  const categories = useMemo(() => {
    const set = new Set(videos.map(v => v.category));
    return ['all', ...Array.from(set)];
  }, [videos]);

  const filtered = useMemo(() => {
    return category === 'all' ? videos : videos.filter(v => v.category === category);
  }, [videos, category]);

  const results = useFuzzySearch(filtered, ['title', 'description', 'tags', 'category'], search);

  const handlePlay = (v: TrainingVideo) => {
    setActive(v);
    updateProgress.mutate({ videoId: v.id, watchedSeconds: 0, completed: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <DynamicSEO
        title="Biblioteca de Vídeos"
        description="Demos de produto e treinamentos rápidos para o time de vendas."
        url="https://multiplixe-v2.vercel.app/biblioteca-videos"
      />
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Voltar ao painel" onClick={() => navigate('/dashboard')} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Biblioteca de Vídeos</h1>
              <p className="text-sm text-muted-foreground">Demos e treinamentos rápidos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Buscar vídeos" placeholder="Buscar vídeos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)} className="rounded-full">
              {c === 'all' ? 'Todas' : c}
            </Button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite" role="status">
          {isLoading ? 'Carregando vídeos' : `${results.length} vídeo(s) encontrado(s)`}
        </p>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : results.length === 0 ? (
          <EmptyState icon={Video} title="Nenhum vídeo encontrado" description="Tente outra busca ou categoria." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(v => (
              <Card key={v.id} className="cursor-pointer overflow-hidden group hover:border-primary/50 transition-colors" onClick={() => handlePlay(v)}>
                <div className="relative aspect-video bg-muted">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Video className="h-12 w-12 text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" fill="white" />
                  </div>
                  {v.duration_seconds > 0 && (
                    <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
                      <Clock className="h-3 w-3 mr-1" /> {formatDuration(v.duration_seconds)}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="capitalize mb-2">{v.category}</Badge>
                  <h3 className="font-semibold line-clamp-2">{v.title}</h3>
                  {v.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{v.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{active?.title}</DialogTitle>
          {active && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={active.video_url}
                controls
                autoPlay
                aria-label={`Reprodutor: ${active.title}`}
                className="w-full h-full"
                onEnded={() => updateProgress.mutate({ videoId: active.id, watchedSeconds: active.duration_seconds, completed: true })}
              />
            </div>
          )}
          {active?.description && <p className="text-sm text-muted-foreground">{active.description}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoLibrary;
