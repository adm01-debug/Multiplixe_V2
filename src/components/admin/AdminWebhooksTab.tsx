import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EVENTOS_WEBHOOK,
  contagensEntregas,
  mascararSecret,
  rotuloEvento,
  useAdminWebhooks,
  useAlternarEndpoint,
  useExcluirEndpoint,
  useLimparEntregas,
  useSalvarEndpoint,
  useTestarEndpoint,
  validarEndpoint,
  type EndpointInput,
  type EndpointWebhook,
  type EntregaWebhook,
  type StatusEntrega,
} from '@/hooks/useAdminWebhooks';

const formularioVazio = (): EndpointInput => ({
  nome: '',
  url: '',
  eventos: ['curso.concluido', 'certificado.emitido'],
  descricao: null,
  is_active: true,
});

const formularioDe = (endpoint: EndpointWebhook): EndpointInput => ({
  nome: endpoint.nome,
  url: endpoint.url,
  eventos: [...endpoint.eventos],
  descricao: endpoint.descricao,
  is_active: endpoint.is_active,
});

const VARIANTE_STATUS: Record<StatusEntrega, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  entregue: 'default',
  pendente: 'secondary',
  falhou: 'destructive',
};

const ROTULO_STATUS: Record<StatusEntrega, string> = {
  entregue: 'Entregue',
  pendente: 'Aguardando',
  falhou: 'Falhou',
};

const formatarData = (valor: string | null) => {
  if (!valor) return '—';
  const data = new Date(valor);
  if (!Number.isFinite(data.getTime())) return '—';
  return data.toLocaleString('pt-BR');
};

const AdminWebhooksTab = () => {
  const { endpoints, entregas, carregando, erro, recarregar } = useAdminWebhooks();
  const salvar = useSalvarEndpoint();
  const alternar = useAlternarEndpoint();
  const excluir = useExcluirEndpoint();
  const testar = useTestarEndpoint();
  const limpar = useLimparEntregas();

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<EndpointInput>(formularioVazio);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [visiveis, setVisiveis] = useState<Record<string, boolean>>({});

  const nomesPorId = useMemo(() => {
    const mapa = new Map<string, string>();
    endpoints.forEach((endpoint) => mapa.set(endpoint.id, endpoint.nome));
    return mapa;
  }, [endpoints]);

  const resumo = useMemo(() => contagensEntregas(entregas), [entregas]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(formularioVazio());
    setErroForm(null);
    setOpen(true);
  };

  const abrirEdicao = (endpoint: EndpointWebhook) => {
    setEditando(endpoint.id);
    setForm(formularioDe(endpoint));
    setErroForm(null);
    setOpen(true);
  };

  const alternarEvento = (evento: string) => {
    setForm((atual) => ({
      ...atual,
      eventos: atual.eventos.includes(evento)
        ? atual.eventos.filter((item) => item !== evento)
        : [...atual.eventos, evento],
    }));
  };

  const enviar = () => {
    const problema = validarEndpoint(form);
    if (problema) {
      setErroForm(problema);
      return;
    }

    setErroForm(null);
    salvar.mutate(
      { ...(editando ? { id: editando } : {}), ...form },
      { onSuccess: () => setOpen(false) },
    );
  };

  const copiarSecret = async (endpoint: EndpointWebhook) => {
    try {
      await navigator.clipboard.writeText(endpoint.secret);
      toast.success('Segredo copiado. Use-o para validar a assinatura X-Multiplixe-Signature.');
    } catch {
      toast.error('Não foi possível copiar. Revele o segredo e copie manualmente.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Integrações por webhook</h2>
          <p className="text-sm text-muted-foreground">
            Envie eventos da plataforma para sistemas externos (RH, ERP, Slack) com assinatura
            HMAC-SHA256 e retentativa automática.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={recarregar}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo endpoint
          </Button>
        </div>
      </div>

      {erro && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar os endpoints: {erro}
          </CardContent>
        </Card>
      )}

      {carregando && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Carregando endpoints...
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && endpoints.length === 0 && (
        <SimpleEmptyState
          icon={Webhook}
          title="Nenhum endpoint configurado"
          description="Cadastre uma URL para receber eventos de curso concluído, certificado emitido e conquistas."
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {endpoints.map((endpoint) => {
          const visivel = visiveis[endpoint.id] === true;
          return (
            <Card key={endpoint.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{endpoint.nome}</h3>
                      <Badge variant={endpoint.is_active ? 'default' : 'outline'}>
                        {endpoint.is_active ? 'Ativo' : 'Desligado'}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {endpoint.url}
                    </p>
                    {endpoint.descricao && (
                      <p className="mt-1 text-sm text-muted-foreground">{endpoint.descricao}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Switch
                      checked={endpoint.is_active}
                      onCheckedChange={(ativo) => alternar.mutate({ id: endpoint.id, ativo })}
                      aria-label={`Ligar ou desligar ${endpoint.nome}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEdicao(endpoint)}
                      aria-label={`Editar ${endpoint.nome}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {endpoint.eventos.map((evento) => (
                    <Badge key={evento} variant="secondary" className="text-xs">
                      {rotuloEvento(evento)}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`secret-${endpoint.id}`} className="text-xs text-muted-foreground">
                    Segredo de assinatura
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`secret-${endpoint.id}`}
                      readOnly
                      value={visivel ? endpoint.secret : mascararSecret(endpoint.secret)}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVisiveis((atual) => ({ ...atual, [endpoint.id]: !visivel }))
                      }
                      aria-label={visivel ? 'Ocultar segredo' : 'Mostrar segredo'}
                    >
                      {visivel ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copiarSecret(endpoint)}
                      aria-label="Copiar segredo"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testar.mutate(endpoint.id)}
                    disabled={testar.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                    {testar.isPending ? 'Enviando...' : 'Enviar teste'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remover o endpoint "${endpoint.nome}"? O histórico de entregas dele também é apagado.`,
                        )
                      ) {
                        excluir.mutate(endpoint.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Últimas entregas</h3>
              <p className="text-xs text-muted-foreground">
                {resumo.entregues} entregues · {resumo.pendentes} aguardando · {resumo.falhas} com
                falha
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm('Limpar todo o histórico de entregas?')) limpar.mutate();
              }}
              disabled={entregas.length === 0 || limpar.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Limpar histórico
            </Button>
          </div>

          {entregas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma entrega registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Evento</th>
                    <th className="py-2 pr-3 font-medium">Destino</th>
                    <th className="py-2 pr-3 font-medium">Situação</th>
                    <th className="py-2 pr-3 font-medium">Tentativas</th>
                    <th className="py-2 pr-3 font-medium">Resposta</th>
                    <th className="py-2 font-medium">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((entrega: EntregaWebhook) => (
                    <tr key={entrega.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{rotuloEvento(entrega.evento)}</td>
                      <td className="py-2 pr-3">{nomesPorId.get(entrega.endpoint_id) ?? 'Removido'}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={VARIANTE_STATUS[entrega.status]}>
                          {ROTULO_STATUS[entrega.status]}
                        </Badge>
                        {entrega.erro && (
                          <span className="ml-2 text-xs text-muted-foreground">{entrega.erro}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{entrega.tentativas}</td>
                      <td className="py-2 pr-3">{entrega.resposta_status ?? '—'}</td>
                      <td className="py-2">{formatarData(entrega.entregue_em ?? entrega.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar endpoint' : 'Novo endpoint de webhook'}</DialogTitle>
            <DialogDescription>
              Cada evento assinado é entregue em até 1 minuto, com nova tentativa automática em caso
              de falha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="webhook-nome">Nome</Label>
              <Input
                id="webhook-nome"
                value={form.nome}
                onChange={(evento) => setForm({ ...form, nome: evento.target.value })}
                placeholder="RH - Folha de pagamento"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="webhook-url">URL de destino (https)</Label>
              <Input
                id="webhook-url"
                value={form.url}
                onChange={(evento) => setForm({ ...form, url: evento.target.value })}
                placeholder="https://sistema.cliente.com/webhooks/multiplixe"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enviamos um POST com o corpo JSON assinado no header
                <code className="mx-1 rounded bg-muted px-1">X-Multiplixe-Signature</code>
                (HMAC-SHA256 do corpo com o segredo abaixo).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos assinados</Label>
              {EVENTOS_WEBHOOK.map((evento) => (
                <label
                  key={evento}
                  htmlFor={`webhook-evento-${evento}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`webhook-evento-${evento}`}
                    checked={form.eventos.includes(evento)}
                    onCheckedChange={() => alternarEvento(evento)}
                  />
                  {rotuloEvento(evento)}
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <Label htmlFor="webhook-descricao">Descrição (opcional)</Label>
              <Textarea
                id="webhook-descricao"
                value={form.descricao ?? ''}
                onChange={(evento) => setForm({ ...form, descricao: evento.target.value })}
                placeholder="Quem consome este webhook e para quê"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Endpoint ativo</p>
                <p className="text-xs text-muted-foreground">
                  Desligado, ele não recebe novos eventos (o histórico é preservado).
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(ativo) => setForm({ ...form, is_active: ativo })}
                aria-label="Endpoint ativo"
              />
            </div>

            {erroForm && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erroForm}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={enviar} disabled={salvar.isPending}>
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              {salvar.isPending ? 'Salvando...' : 'Salvar endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWebhooksTab;