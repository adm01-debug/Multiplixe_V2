import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GripVertical, X, Loader2, Sparkles } from 'lucide-react';
import { useOnboardingWorkflows, useSaveWorkflow, useDeleteWorkflow, type OnboardingWorkflow, type OnboardingStep, type OnboardingStepType } from '@/hooks/useOnboardingWorkflow';
import { onboardingWorkflowSchema } from '@/lib/salesEnablementSchemas';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import { toast } from 'sonner';

const STEP_TYPES: { value: OnboardingStepType; label: string }[] = [
  { value: 'video', label: 'Vídeo' },
  { value: 'playbook', label: 'Playbook' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'course', label: 'Curso' },
  { value: 'task', label: 'Tarefa' },
];

const emptyForm: Partial<OnboardingWorkflow> = {
  name: '', description: '', role_target: 'sales', steps: [], is_active: true, is_default: false,
};

const AdminWorkflowsTab = () => {
  const { data: workflows = [], isLoading } = useOnboardingWorkflows();
  const save = useSaveWorkflow();
  const del = useDeleteWorkflow();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<OnboardingWorkflow>>(emptyForm);

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (w: OnboardingWorkflow) => { setForm(w); setOpen(true); };

  const addStep = () => {
    const newStep: OnboardingStep = { id: crypto.randomUUID(), type: 'task', title: '', required: true };
    setForm(f => ({ ...f, steps: [...(f.steps || []), newStep] }));
  };
  const updateStep = (idx: number, patch: Partial<OnboardingStep>) => {
    setForm(f => ({ ...f, steps: (f.steps || []).map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  };
  const removeStep = (idx: number) => {
    setForm(f => ({ ...f, steps: (f.steps || []).filter((_, i) => i !== idx) }));
  };
  const moveStep = (idx: number, dir: -1 | 1) => {
    setForm(f => {
      const steps = [...(f.steps || [])];
      const target = idx + dir;
      if (target < 0 || target >= steps.length) return f;
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      return { ...f, steps };
    });
  };

  const handleSave = async () => {
    const parsed = onboardingWorkflowSchema.safeParse({
      name: form.name || '',
      description: form.description || null,
      role_target: form.role_target || 'sales',
      steps: form.steps || [],
      is_active: form.is_active ?? true,
      is_default: form.is_default ?? false,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }
    await save.mutateAsync({ ...form, ...parsed.data });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Workflows de Onboarding</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo Workflow</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : workflows.length === 0 ? (
        <SimpleEmptyState icon={Sparkles} title="Nenhum workflow criado" description="Crie um workflow para guiar novos vendedores." />
      ) : (
        <div className="grid gap-3">
          {workflows.map(w => (
            <Card key={w.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {w.name}
                      {w.is_default && <Badge variant="default">Padrão</Badge>}
                      {!w.is_active && <Badge variant="secondary">Inativo</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{w.description || 'Sem descrição'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm('Excluir workflow?')) del.mutate(w.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{w.steps.length} passo(s) · destinatário: {w.role_target}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar' : 'Novo'} Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Destinatário (role)</Label>
                <Input value={form.role_target || 'sales'} onChange={e => setForm(f => ({ ...f, role_target: e.target.value }))} />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label className="text-sm">Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_default ?? false} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
                  <Label className="text-sm">Padrão</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Passos</Label>
                <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
              </div>
              {(form.steps || []).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center border rounded-md">Nenhum passo. Adicione ao menos um.</p>
              )}
              {(form.steps || []).map((step, idx) => (
                <div key={step.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveStep(idx, -1)} className="text-xs text-muted-foreground hover:text-foreground">▲</button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <button type="button" onClick={() => moveStep(idx, 1)} className="text-xs text-muted-foreground hover:text-foreground">▼</button>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Select value={step.type} onValueChange={(v: OnboardingStepType) => updateStep(idx, { type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STEP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Título" value={step.title} onChange={e => updateStep(idx, { title: e.target.value })} className="col-span-2" />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeStep(idx)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-8">
                    <Input placeholder="ID do recurso (opcional)" value={step.resource_id || ''} onChange={e => updateStep(idx, { resource_id: e.target.value })} />
                    <Input placeholder="URL (opcional)" value={step.resource_url || ''} onChange={e => updateStep(idx, { resource_url: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <Switch checked={step.required} onCheckedChange={v => updateStep(idx, { required: v })} />
                    <Label className="text-xs">Obrigatório</Label>
                  </div>
                </div>
              ))}
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

export default AdminWorkflowsTab;
