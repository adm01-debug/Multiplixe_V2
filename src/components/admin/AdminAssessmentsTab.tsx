import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Target, Loader2 } from 'lucide-react';
import { useSkillAssessments, useSaveAssessment, useDeleteAssessment, type SkillAssessment } from '@/hooks/useSkillAssessments';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import { supabase } from '@/integrations/supabase/client';

interface QuizOption { id: string; title: string }

const emptyForm: Partial<SkillAssessment> = {
  title: '', description: '', skill_area: '', frequency_days: 90, passing_score: 70, quiz_id: null, is_active: true,
};

const AdminAssessmentsTab = () => {
  const { data: assessments = [], isLoading } = useSkillAssessments();
  const save = useSaveAssessment();
  const del = useDeleteAssessment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<SkillAssessment>>(emptyForm);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);

  useEffect(() => {
    supabase.from('quizzes').select('id, title').order('title').then(({ data }) => {
      if (data) setQuizzes(data);
    });
  }, []);

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (a: SkillAssessment) => { setForm(a); setOpen(true); };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.skill_area?.trim()) return;
    await save.mutateAsync(form);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Avaliações Periódicas</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Avaliação</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : assessments.length === 0 ? (
        <SimpleEmptyState icon={Target} title="Nenhuma avaliação criada" description="Crie avaliações periódicas para medir competências." />
      ) : (
        <div className="grid gap-3">
          {assessments.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {a.title}
                        {!a.is_active && <Badge variant="secondary">Inativo</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{a.description || 'Sem descrição'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm('Excluir avaliação?')) del.mutate(a.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Área: {a.skill_area}</Badge>
                  <Badge variant="outline">A cada {a.frequency_days} dias</Badge>
                  <Badge variant="outline">Aprovação: {a.passing_score}%</Badge>
                  {a.quiz_id && <Badge variant="outline">Quiz vinculado</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar' : 'Nova'} Avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título</Label>
              <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Área de competência</Label>
              <Input placeholder="Ex: Negociação, Prospecção, Fechamento" value={form.skill_area || ''} onChange={e => setForm(f => ({ ...f, skill_area: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequência (dias)</Label>
                <Input type="number" min={1} value={form.frequency_days ?? 90} onChange={e => setForm(f => ({ ...f, frequency_days: parseInt(e.target.value) || 90 }))} />
              </div>
              <div>
                <Label>Nota de aprovação (%)</Label>
                <Input type="number" min={0} max={100} value={form.passing_score ?? 70} onChange={e => setForm(f => ({ ...f, passing_score: parseInt(e.target.value) || 70 }))} />
              </div>
            </div>
            <div>
              <Label>Quiz vinculado (opcional)</Label>
              <Select value={form.quiz_id || 'none'} onValueChange={v => setForm(f => ({ ...f, quiz_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar quiz" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAssessmentsTab;
