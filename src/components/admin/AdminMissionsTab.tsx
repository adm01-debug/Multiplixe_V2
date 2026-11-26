import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import {
  useAdminMissions,
  useAlternarMissao,
  useExcluirMissao,
  useSalvarMissao,
  type MissaoAdmin,
  type MissaoInput,
} from '@/hooks/useAdminMissions';
import type { MetricaMissao } from '@/hooks/useDepartmentChallenges';

const METRICAS: { valor: MetricaMissao; rotulo: string }[] = [
  { valor: 'xp', rotulo: 'XP coletivo' },
  { valor: 'lessons', rotulo: 'Aulas concluídas' },
  { valor: 'courses', rotulo: 'Cursos concluídos' },
];

const paraInput = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

const inicioDaSemana = () => {
  const agora = new Date();
  const dia = agora.getDay();
  agora.setDate(agora.getDate() - dia);
  agora.setHours(0, 0, 0, 0);
  return agora;
};

const formulaVazia = (): MissaoInput => {
  const inicio = inicioDaSemana();
  const fim = new Date(inicio.getTime() + 7 * 86400000);
  return {
    title: '',
    description: null,
    department: null,
    metric: 'xp',
    target_value: 500,
    xp_reward: 100,
    starts_at: paraInput(inicio.toISOString()),
    ends_at: paraInput(fim.toISOString()),
    is_active: true,
  };
};

const AdminMissionsTab = () => {
  const { missoes, carregando, erro, recarregar } = useAdminMissions();
  const salvar = useSalvarMissao();
  const alternar = useAlternarMissao();
  const excluir = useExcluirMissao();

  const [open, setOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<MissaoInput>(formulaVazia());
  const [departamentoTexto, setDepartamentoTexto] = useState('');

  const ordenadas = useMemo(
    () =>
      [...missoes].sort((a, b) => {
        if (a.ativa !== b.ativa) return a.ativa ? -1 : 1;
        return new Date(b.fim).getTime() - new Date(a.fim).getTime();
      }),
    [missoes],
  );

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formulaVazia());
    setDepartamentoTexto('');
    setOpen(true);
  };

  const abrirEdicao = (missao: MissaoAdmin) => {
    setEditandoId(missao.id);
    setForm({
      title: missao.titulo,
      description: missao.descricao || null,
      department: missao.departamento,
      metric: missao.metrica,
      target_value: missao.meta,
      xp_reward: missao.xp,
      starts_at: paraInput(missao.inicio),
      ends_at: paraInput(missao.fim),
      is_active: missao.ativa,
    });
    setDepartamentoTexto(missao.departamento ?? '');
    setOpen(true);
  };

  const submeter = async () => {
    if (!form.title.trim()) return;
    if (new Date(form.ends_at).getTime() <= new Date(form.starts_at).getTime()) return;

    await salvar.mutateAsync({
      ...form,
      id: editandoId ?? undefined,
      title: form.title.trim(),
      description: form.description?.trim() ? form.description.trim() : null,
      department: departamentoTexto.trim() ? departamentoTexto.trim().toLowerCase() : null,
      target_value: Math.max(1, Math.round(form.target_value)),
      xp_reward: Math.max(0, Math.round(form.xp_reward)),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
    });
    setOpen(false);
  };

  const periodoValido = new Date(form.ends_at).getTime() > new Date(form.starts_at).getTime();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Missões de departamento</h2>
          <p className="text-sm text-muted-foreground">
            Metas coletivas por equipe. Sem departamento, a missão vale para todos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => recarregar()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nova missão
          </Button>
        </div>
      </div>

      {erro && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar as missões: {erro}
          </CardContent>
        </Card>
      )}

      {carregando && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Carregando missões…
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && ordenadas.length === 0 && (
        <SimpleEmptyState
          icon={Users}
          title="Nenhuma missão criada"
          description="Crie a primeira meta coletiva para engajar os departamentos."
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {ordenadas.map((missao) => {
          const percentual =
            missao.meta > 0 ? Math.min(100, Math.round((missao.progresso / missao.meta) * 100)) : 0;

          return (
            <Card key={missao.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{missao.titulo}</h3>
                      <Badge variant={missao.ativa ? 'secondary' : 'outline'}>
                        {missao.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {missao.departamento ?? 'Todos os departamentos'} ·{' '}
                      {METRICAS.find((m) => m.valor === missao.metrica)?.rotulo} · {missao.xp} XP
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${missao.titulo}`}
                      onClick={() => abrirEdicao(missao)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${missao.titulo}`}
                      onClick={() => excluir.mutate(missao.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <Progress
                  value={percentual}
                  aria-label={`Progresso: ${percentual}%`}
                  className="h-2"
                />
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {missao.progresso} / {missao.meta}
                  </span>
                  <span>
                    {missao.participantes} de {missao.membros} participantes · {missao.resgates} resgates
                  </span>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(missao.inicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(missao.fim).toLocaleDateString('pt-BR')}
                  </span>
                  <label className="flex items-center gap-2 text-xs">
                    Ativa
                    <Switch
                      checked={missao.ativa}
                      onCheckedChange={(valor) => alternar.mutate({ id: missao.id, ativa: valor })}
                      aria-label={`Ativar ou desativar ${missao.titulo}`}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar missão' : 'Nova missão de departamento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="missao-titulo">Título</Label>
              <Input
                id="missao-titulo"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Missão coletiva: 500 XP em equipe"
              />
            </div>

            <div>
              <Label htmlFor="missao-descricao">Descrição</Label>
              <Textarea
                id="missao-descricao"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="missao-departamento">Departamento</Label>
                <Input
                  id="missao-departamento"
                  value={departamentoTexto}
                  onChange={(e) => setDepartamentoTexto(e.target.value)}
                  placeholder="vazio = todos"
                />
              </div>
              <div>
                <Label htmlFor="missao-metrica">Métrica</Label>
                <Select
                  value={form.metric}
                  onValueChange={(valor) => setForm({ ...form, metric: valor as MetricaMissao })}
                >
                  <SelectTrigger id="missao-metrica">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICAS.map((metrica) => (
                      <SelectItem key={metrica.valor} value={metrica.valor}>
                        {metrica.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="missao-meta">Meta</Label>
                <Input
                  id="missao-meta"
                  type="number"
                  min={1}
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="missao-xp">Recompensa (XP)</Label>
                <Input
                  id="missao-xp"
                  type="number"
                  min={0}
                  value={form.xp_reward}
                  onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="missao-inicio">Início</Label>
                <Input
                  id="missao-inicio"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="missao-fim">Fim</Label>
                <Input
                  id="missao-fim"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>

            {!periodoValido && (
              <p className="text-xs text-destructive">O fim precisa ser depois do início.</p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.is_active}
                onCheckedChange={(valor) => setForm({ ...form, is_active: valor })}
                aria-label="Missão ativa"
              />
              Missão ativa
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submeter}
              disabled={!form.title.trim() || !periodoValido || salvar.isPending}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMissionsTab;