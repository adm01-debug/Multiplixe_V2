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
import { paraInputLocal } from '@/lib/datetimeInput';
import { type DictPath, useT } from '@/lib/i18n';
import {
  gerarSlug,
  useAdminSeasonalEvents,
  useAlternarEvento,
  useExcluirEvento,
  useSalvarEvento,
  type EventoAdmin,
  type EventoInput,
} from '@/hooks/useAdminSeasonalEvents';

const inicioPadrao = () => paraInputLocal(new Date());
const fimPadrao = () => paraInputLocal(new Date(Date.now() + 7 * 86400000));

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
  starts_at: paraInputLocal(evento.starts_at),
  ends_at: paraInputLocal(evento.ends_at),
  xp_multiplier: evento.xp_multiplier,
  is_active: evento.is_active,
});

type Situacao = 'agora' | 'programado' | 'encerrado' | 'desligado';

const ORDEM: Record<Situacao, number> = { agora: 0, programado: 1, encerrado: 2, desligado: 2 };

const ETIQUETA: Record<Situacao, DictPath> = {
  agora: 'eventsAdmin.statusNow',
  programado: 'eventsAdmin.statusScheduled',
  encerrado: 'eventsAdmin.statusEnded',
  desligado: 'eventsAdmin.statusOff',
};

const situacao = (evento: EventoAdmin) => {
  if (!evento.is_active) return { chave: 'desligado' as const, variante: 'outline' as const };
  const agora = Date.now();
  const inicio = new Date(evento.starts_at).getTime();
  const fim = new Date(evento.ends_at).getTime();
  if (fim <= agora) return { chave: 'encerrado' as const, variante: 'outline' as const };
  if (inicio > agora) return { chave: 'programado' as const, variante: 'secondary' as const };
  return { chave: 'agora' as const, variante: 'default' as const };
};

const AdminEventsTab = () => {
  const { t } = useT();
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
      const diff = ORDEM[situacao(a).chave] - ORDEM[situacao(b).chave];
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
      setErroForm(t('eventsAdmin.errTitle'));
      return;
    }
    if (slug.length < 3) {
      setErroForm(t('eventsAdmin.errSlug'));
      return;
    }

    const inicio = new Date(form.starts_at).getTime();
    const fim = new Date(form.ends_at).getTime();
    if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) {
      setErroForm(t('eventsAdmin.errPeriod'));
      return;
    }

    const multiplicador = Number(form.xp_multiplier);
    if (!Number.isFinite(multiplicador) || multiplicador < 1 || multiplicador > 4) {
      setErroForm(t('eventsAdmin.errMultiplier'));
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
          <h2 className="text-lg font-semibold">{t('eventsAdmin.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('eventsAdmin.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => recarregar()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('eventsAdmin.refresh')}
          </Button>
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('eventsAdmin.newEvent')}
          </Button>
        </div>
      </div>

      {erro && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('eventsAdmin.loadError')}: {erro}
          </CardContent>
        </Card>
      )}

      {carregando && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('eventsAdmin.loading')}
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && ordenados.length === 0 && (
        <SimpleEmptyState
          icon={CalendarDays}
          title={t('eventsAdmin.emptyTitle')}
          description={t('eventsAdmin.emptyDesc')}
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
                      <Badge variant={estado.variante}>{t(ETIQUETA[estado.chave])}</Badge>
                    </div>
                    {evento.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{evento.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{t('eventsAdmin.slug')}: {evento.slug}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    XP {evento.xp_multiplier}x
                  </Badge>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {new Date(evento.starts_at).toLocaleString()} {t('eventsAdmin.until')} {new Date(evento.ends_at).toLocaleString()}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={evento.is_active}
                      onCheckedChange={(valor) => alternar.mutate({ id: evento.id, ativo: valor })}
                      aria-label={`${t('eventsAdmin.toggleAria')} ${evento.title}`}
                    />
                    {evento.is_active ? t('eventsAdmin.on') : t('eventsAdmin.off')}
                  </label>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(evento)}>
                      <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('eventsAdmin.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluir.mutate(evento.id)}
                      disabled={excluir.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('common.delete')}
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
            <DialogTitle>{editando ? t('eventsAdmin.dialogEdit') : t('eventsAdmin.dialogNew')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evento-titulo">{t('eventsAdmin.titleField')}</Label>
              <Input
                id="evento-titulo"
                value={form.title}
                maxLength={120}
                onChange={(e) => setForm((atual) => ({ ...atual, title: e.target.value }))}
                placeholder={t('eventsAdmin.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento-descricao">{t('eventsAdmin.descriptionField')}</Label>
              <Textarea
                id="evento-descricao"
                value={form.description ?? ''}
                rows={2}
                onChange={(e) => setForm((atual) => ({ ...atual, description: e.target.value }))}
                placeholder={t('eventsAdmin.descriptionPlaceholder')}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evento-emoji">{t('eventsAdmin.emojiField')}</Label>
                <Input
                  id="evento-emoji"
                  value={form.emoji ?? ''}
                  maxLength={4}
                  onChange={(e) => setForm((atual) => ({ ...atual, emoji: e.target.value }))}
                  placeholder={t('eventsAdmin.emojiPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento-multiplicador">{t('eventsAdmin.multiplierField')}</Label>
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
                <Label htmlFor="evento-inicio">{t('eventsAdmin.startField')}</Label>
                <Input
                  id="evento-inicio"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((atual) => ({ ...atual, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evento-fim">{t('eventsAdmin.endField')}</Label>
                <Input
                  id="evento-fim"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((atual) => ({ ...atual, ends_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento-slug">{t('eventsAdmin.slugField')}</Label>
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
              {t('eventsAdmin.activeField')}
            </label>

            {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submeter} disabled={salvar.isPending}>
              {salvar.isPending ? t('eventsAdmin.saving') : t('eventsAdmin.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventsTab;