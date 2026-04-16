import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePlaybooks, useSavePlaybook, useDeletePlaybook, type Playbook } from '@/hooks/usePlaybooks';

const AdminPlaybooksTab = () => {
  const { data: list = [], isLoading } = usePlaybooks(true);
  const save = useSavePlaybook();
  const del = useDeletePlaybook();
  const [editing, setEditing] = useState<Partial<Playbook> | null>(null);

  const handleSave = () => {
    if (!editing?.title || !editing?.slug || !editing?.content) return;
    save.mutate({
      ...editing,
      tags: typeof editing.tags === 'string' ? (editing.tags as unknown as string).split(',').map(t => t.trim()).filter(Boolean) : (editing.tags || []),
    }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Playbooks ({list.length})</h3>
        <Button onClick={() => setEditing({ category: 'general', is_published: false, tags: [] })}>
          <Plus className="h-4 w-4 mr-2" /> Novo Playbook
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="space-y-2">
          {list.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{p.title}</h4>
                    {!p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Rascunho</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.view_count} views</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...p, tags: p.tags })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm('Excluir?') && del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Novo'} Playbook</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label>Categoria</Label><Input value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Resumo</Label><Textarea value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} rows={2} /></div>
              <div><Label>Conteúdo (Markdown)</Label><Textarea value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={10} className="font-mono text-sm" /></div>
              <div><Label>Tags (separadas por vírgula)</Label><Input value={Array.isArray(editing.tags) ? editing.tags.join(', ') : ''} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} /></div>
              <div className="flex items-center gap-2"><Switch checked={!!editing.is_published} onCheckedChange={v => setEditing({ ...editing, is_published: v })} /><Label>Publicado</Label></div>
              <Button onClick={handleSave} disabled={save.isPending} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlaybooksTab;
