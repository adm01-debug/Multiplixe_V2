import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTrainingVideos, useSaveTrainingVideo, useDeleteTrainingVideo, type TrainingVideo } from '@/hooks/useTrainingVideos';
import { trainingVideoSchema } from '@/lib/salesEnablementSchemas';
import { toast } from 'sonner';

const AdminVideosTab = () => {
  const { data: list = [], isLoading } = useTrainingVideos(true);
  const save = useSaveTrainingVideo();
  const del = useDeleteTrainingVideo();
  const [editing, setEditing] = useState<Partial<TrainingVideo> | null>(null);

  const handleSave = () => {
    if (!editing) return;
    const parsed = trainingVideoSchema.safeParse({
      title: editing.title || '',
      description: editing.description || null,
      video_url: editing.video_url || '',
      thumbnail_url: editing.thumbnail_url || '',
      category: editing.category || '',
      duration_seconds: Number(editing.duration_seconds) || 0,
      tags: editing.tags || [],
      is_published: !!editing.is_published,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }
    save.mutate({ ...editing, ...parsed.data }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vídeos ({list.length})</h3>
        <Button onClick={() => setEditing({ category: 'general', is_published: false, duration_seconds: 0, tags: [] })}>
          <Plus className="h-4 w-4 mr-2" /> Novo Vídeo
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="space-y-2">
          {list.map(v => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{v.title}</h4>
                  <p className="text-xs text-muted-foreground">{v.category} · {v.view_count} views {!v.is_published && '· Rascunho'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(v)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm('Excluir?') && del.mutate(v.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Novo'} Vídeo</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label htmlFor="video-title">Título</Label><Input id="video-title" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} /></div>
              <div><Label htmlFor="video-url">URL do vídeo</Label><Input id="video-url" value={editing.video_url || ''} onChange={e => setEditing({ ...editing, video_url: e.target.value })} /></div>
              <div><Label htmlFor="video-thumbnail">URL da thumbnail</Label><Input id="video-thumbnail" value={editing.thumbnail_url || ''} onChange={e => setEditing({ ...editing, thumbnail_url: e.target.value })} /></div>
              <div><Label htmlFor="video-category">Categoria</Label><Input id="video-category" value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label htmlFor="video-duration">Duração (segundos)</Label><Input id="video-duration" type="number" value={editing.duration_seconds || 0} onChange={e => setEditing({ ...editing, duration_seconds: Number(e.target.value) })} /></div>
              <div><Label htmlFor="video-tags">Tags (vírgula)</Label><Input id="video-tags" value={Array.isArray(editing.tags) ? editing.tags.join(', ') : ''} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} /></div>
              <div className="flex items-center gap-2"><Switch checked={!!editing.is_published} onCheckedChange={v => setEditing({ ...editing, is_published: v })} /><Label>Publicado</Label></div>
              <Button onClick={handleSave} disabled={save.isPending} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideosTab;
