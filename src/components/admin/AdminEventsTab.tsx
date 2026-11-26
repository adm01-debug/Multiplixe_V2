import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Pencil, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import {
  gerarSlug,
  useAdminSeasonalEvents,
  useAlternarEvento,
  useExcluirEvento,
  useSalvarEvento,
  type EventoAdmin,
  type EventoInput,
} from '@/hooks/useAdminSeasonalEvents';

const paraInput = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

const inicioPadrao = () => paraInput(new Date().toISOString());
const fimPadrao = () => paraInput(new Date(Date.now() + 7 * 86400000).toISOString());

const formularioVazio = (): EventoInput => ({
  slug: '',
  title: '',
  description: null,
  emoji: null,
  starts_at: inicioPadrao(),
  ends_at: fimPadrao(),
  xp_multiplier: 1.5,
  is_active: true,
});

const formularioDe = (evento: EventoAdmin): EventoInput => ({
  slug: evento.slug,
  title: evento.title,
  description: evento.description,
  emoji: evento.emoji,
  starts_at: paraInput(evento.starts_at),
  ends_at: paraInput(evento.ends_at),
  xp_multiplier: evento.xp_multiplier,
  is_active: evento.is_active,
});

const situacao = (evento: EventoAdmin) => {
  if (!evento.is_active) return { rotulo: 'Desligado', variante: 'outline' as const };
  const agora = Date.now();
  const inicio = new Date(evento.starts_at).getTime();
  const fim = new Date(evento.ends_at).getTime();
  if (fim <= agora) return { rotulo: 'Encerrado', variante: 'outline' as const };
  if (inicio > agora) return { rotulo: 'Programado', variante: 'secondary' as const };
  return { rotulo: 'Acontecendo agora', variante: 'default' as const };
};

const AdminEventsTab = () => {
  const { eventos, carregando, erro, recarregar } = useAdminSeasonalEvents();
  const salvar = useSalvarEvento();
  const alternar = useAlternarEvento();
  const excluir = useExcluirEvento();

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<EventoInput>(formularioVazio);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const ordenados = useMemo(() => {
    return [...eventos].sort((a, b) => {
      const pontos = (e: EventoAdmin) => {
        const s = situacao(e);
        if (s.rotulo === 'Acontecendo agora') return 0;
        if (s.rotulo === 'Programado') return 1;
        return 2;
      };
      const diff = pontos(a) - pontos(b);
      if (diff !== 0) return diff;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  }, [eventos]);

  const abrirNovo = () => {
    setEditando(null);
    setErroForm(null);
    setForm(formularioVazio());
    setOpen(true);
  };

  const abrirEdicao = (evento: EventoAdmin) => {
    setEditando(evento.id);
    setErroForm(null);
    setForm(formularioDe(evento));
    setOpen(true);
  };

  const submeter = () => {
    const titulo = form.title.trim();
    const slug = (form.slug.trim() || gerarSlug(titulo)).slice(0, 60);

    if (titulo.length < 3) {
      setErroForm('O título precisa ter pelo menos 3 letras.');
      return;
    }
    if (slug.length < 3) {
      setErroForm('Não foi possível gerar o identificador do evento. Informe um título melhor.');
      return;
    }

    const inicio = new Date(form.starts_at).getTime();
    const fim = new Date(form.ends_at).getTime();
    if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) {
      setErroForm('A data de término precisa ser depois da data de início.');
      return;
    }

    const multiplicador = Number(form.xp_multiplier);
    if (!Number.isFinite(multiplicador) || multiplicador < 1 || multiplicador > 4) {
      setErroForm('O multiplicador de XP precisa estar entre 1 e 4.');
      return;
    }

    setErroForm(null);
    salvar.mutate(
      {
        ...(editando ? { id: editando } : {}),
        slug,
        title: titulo,
        description: form.description?.trim() ? form.description.trim() : null,
        emoji: form.emoji?.trim() ? form.emoji.trim() : null,
        starts_at: new Date(inicio).toISOString(),
        ends_at: new Date(fim).toISOString(),
        xp_multiplier: multiplicador,
        is_active: form.is_active,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Eventos sazonais</h2>
          <p className="text-sm text-muted-foreground">
            Períodos temáticos com bônus de XP, concedido automaticamente enquanto o evento estiver aberto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => recarregar()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo evento
          </Button>
        </div>
      </div>

      {erro && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar os eventos: {erro}
          </CardContent>
        </Card>
      )}

      {carregando && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Carregando eventos...
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && ordenados.length === 0 && (
        <SimpleEmptyState
          icon={CalendarDays}
          title="Nenhum evento sazonal criado"
          description="Crie o primeiro período temático para multiplicar o XP ganho pelos alunos."
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {ordenados.map((evento) => {
          const estado = situacao(evento);
          return (
            <Card key={evento.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {evento.emoji ? `${evento.emoji} ` : ''}
                        {evento.title}
                      </h3>
                      <Badge variant={estado.variante}>{estado.rotulo}</Badge>
                    </div>
                    {evento.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{evento.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">Identificador: {evento.slug}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    XP {evento.xp_multiplier}x
                  </Badge>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {new Date(evento.starts_at).toLocaleString()} até {new Date(evento.ends_at).toLocaleString()}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={evento.is_active}
                      onCheckedChange={(valor) => alternar.mutate({ id: evento.id, ativo: valor })}
                      aria-label={`Ligar ou desligar o evento ${evento.title}`}
                    />
                    {evento.is_active ? 'Ligado' : 'Desligado'}
                  </label>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(evento)}>
                      <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluir.mutate(evento.id)}
                      disabled={excluir.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar evento sazonal' : 'Novo evento sazonal'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evento-titulo">Título</Label>
              <Input
                id="evento-titulo"
                value={form.title}
                maxLength={120}
                onChange={(e) => setForm((atual) => ({ ...atual, title: e.target.value }))}
                placeholder="Semana do Produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento-descricao">Descrição</Label>
              <Textarea
                id="evento-descricao"
                value={form.description ?? ''}
                rows={2}
                onChange={(e) => setForm((atual) => ({ ...atual, description: e.target.value }))}
                placeholder="Bonus de XP para todos os alunos durante a semana."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evento-emoji">Símbolo</Label>
                <Input
                  id="evento-emoji"
                  value={form.emoji ?? ''}
                  maxLength={4}
                  onChange={(e) => setForm((atual) => ({ ...atual, emoji: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento-multiplicador">Multiplicador de XP (1 a 4)</Label>
                <Input
                  id="evento-multiplicador"
                  type="number"
                  min={1}
                  max={4}
                  step={0.1}
                  value={form.xp_multiplier}
                  onChange={(e) =>
                    setForm((atual) => ({ ...atual, xp_multiplier: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evento-inicio">Início</Label>
                <Input
                  id="evento-inicio"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((atual) => ({ ...atual, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento-fim">Término</Label>
                <Input
                  id="evento-fim"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((atual) => ({ ...atual, ends_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento-slug">Identificador (opcional)</Label>
              <Input
                id="evento-slug"
                value={form.slug}
                maxLength={60}
                onChange={(e) => setForm((atual) => ({ ...atual, slug: e.target.value }))}
                placeholder="semana-do-produto"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.is_active}
                onCheckedChange={(valor) => setForm((atual) => ({ ...atual, is_active: valor }))}
              />
              Evento ligado
            </label>

            {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submeter} disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : 'Salvar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventsTab;