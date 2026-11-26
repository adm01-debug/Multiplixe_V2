import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import IconTooltip from '@/components/ui/icon-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Eye, EyeOff, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import SimpleEmptyState from '@/components/SimpleEmptyState';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import {
  useAdminStoreItems,
  useDeleteStoreItem,
  useGrantCoins,
  useSaveStoreItem,
  useToggleStoreItem,
  type StoreItemInput,
} from '@/hooks/useWallet';
import { STORE_CATEGORIES, categoryLabel, formatCoins } from '@/lib/store';
import type { UserStat } from '@/components/admin/admin-users/types';
import { toast } from 'sonner';

interface Props {
  users: UserStat[];
}

const FORM_VAZIO: StoreItemInput = {
  slug: '',
  name: '',
  description: null,
  category: 'power_up',
  price_coins: 100,
  icon: null,
  is_active: true,
  sort_order: 100,
};

const AdminStoreTab = ({ users }: Props) => {
  const { data: itens = [], isLoading } = useAdminStoreItems();
  const salvar = useSaveStoreItem();
  const alternar = useToggleStoreItem();
  const excluir = useDeleteStoreItem();
  const conceder = useGrantCoins();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StoreItemInput>(FORM_VAZIO);

  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [valorBonus, setValorBonus] = useState<number>(50);
  const [motivoBonus, setMotivoBonus] = useState<string>('');

  const usuariosFiltrados = useFuzzySearch(users, ['full_name', 'email'], buscaUsuario).slice(0, 50);
  const usuarioSelecionado = useMemo(
    () => users.find((u) => u.user_id === usuarioId) ?? null,
    [users, usuarioId],
  );

  const stats = useMemo(() => {
    const ativos = itens.filter((item) => item.is_active).length;
    return { total: itens.length, ativos, inativos: itens.length - ativos };
  }, [itens]);

  const abrirNovo = () => {
    setForm({ ...FORM_VAZIO, sort_order: (itens.at(-1)?.sort_order ?? 0) + 10 });
    setOpen(true);
  };

  const abrirEdicao = (item: (typeof itens)[number]) => {
    setForm({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      category: item.category as StoreItemInput['category'],
      price_coins: item.price_coins,
      icon: item.icon,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setOpen(true);
  };

  const handleSalvar = () => {
    if (!form.slug.trim()) {
      toast.error('Informe o identificador do item (ex: xp-boost-2x)');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Informe o nome do item');
      return;
    }
    if (!Number.isFinite(form.price_coins) || form.price_coins < 0) {
      toast.error('O preco em moedas precisa ser um numero igual ou maior que zero');
      return;
    }
    salvar.mutate(form, { onSuccess: () => setOpen(false) });
  };

  const handleConceder = () => {
    if (!usuarioId) {
      toast.error('Selecione o aluno que vai receber as moedas');
      return;
    }
    if (!Number.isFinite(valorBonus) || valorBonus <= 0) {
      toast.error('Informe quantas moedas conceder');
      return;
    }
    if (!motivoBonus.trim()) {
      toast.error('Escreva o motivo da concessao - ele fica registrado no extrato do aluno');
      return;
    }
    conceder.mutate(
      { userId: usuarioId, amount: Math.trunc(valorBonus), reason: motivoBonus.trim() },
      {
        onSuccess: () => {
          setMotivoBonus('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Loja de recompensas</h3>
          <p className="text-xs text-muted-foreground">
            {stats.total} itens · {stats.ativos} ativos · {stats.inativos} fora da loja
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-2" /> Novo item
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <h4 className="font-medium">Conceder moedas a um aluno</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="bonus-busca">Buscar aluno</Label>
              <Input
                id="bonus-busca"
                placeholder="Nome ou e-mail"
                value={buscaUsuario}
                onChange={(e) => setBuscaUsuario(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bonus-aluno">Aluno</Label>
              <Select value={usuarioId} onValueChange={setUsuarioId}>
                <SelectTrigger id="bonus-aluno">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosFiltrados.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || 'Sem nome'} · {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bonus-valor">Moedas</Label>
              <Input
                id="bonus-valor"
                type="number"
                min={1}
                value={valorBonus}
                onChange={(e) => setValorBonus(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bonus-motivo">Motivo</Label>
            <Input
              id="bonus-motivo"
              placeholder="Ex: premio do desafio de vendas de novembro"
              value={motivoBonus}
              onChange={(e) => setMotivoBonus(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {usuarioSelecionado
                ? `Creditando para ${usuarioSelecionado.full_name || usuarioSelecionado.email}`
                : 'Selecione um aluno para creditar'}
            </p>
            <Button onClick={handleConceder} disabled={conceder.isPending}>
              {conceder.isPending ? 'Creditando...' : `Creditar ${formatCoins(valorBonus || 0)}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando itens...</p>
      ) : itens.length === 0 ? (
        <SimpleEmptyState
          icon={ShoppingBag}
          title="Nenhum item cadastrado"
          description="Cadastre power-ups, temas e avatares para os alunos trocarem por moedas."
        />
      ) : (
        <div className="space-y-2">
          {itens.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon || '🎁'}</span>
                    <h4 className="truncate font-medium">{item.name}</h4>
                    {!item.is_active && <Badge variant="secondary">Fora da loja</Badge>}
                    <Badge variant="outline">{categoryLabel(item.category)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.description || 'Sem descricao'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCoins(item.price_coins)} · slug {item.slug} · ordem {item.sort_order}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconTooltip label={item.is_active ? 'Retirar da loja' : 'Disponibilizar na loja'}>
                    <Button
                      size="icon"
                      aria-label={item.is_active ? 'Retirar da loja' : 'Disponibilizar na loja'}
                      variant="ghost"
                      onClick={() => alternar.mutate({ id: item.id, is_active: !item.is_active })}
                    >
                      {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </IconTooltip>
                  <IconTooltip label="Editar item">
                    <Button size="icon" aria-label="Editar item" variant="ghost" onClick={() => abrirEdicao(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </IconTooltip>
                  <IconTooltip label="Excluir item">
                    <Button
                      size="icon"
                      aria-label="Excluir item"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Excluir este item da loja? Alunos que ja compraram mantem o item na colecao.')) {
                          excluir.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </IconTooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar' : 'Novo'} item da loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="item-slug">Identificador (slug)</Label>
                <Input
                  id="item-slug"
                  placeholder="xp-boost-2x"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="item-nome">Nome</Label>
                <Input
                  id="item-nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-descricao">Descricao</Label>
              <Textarea
                id="item-descricao"
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="item-categoria">Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value as StoreItemInput['category'] })}
                >
                  <SelectTrigger id="item-categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_CATEGORIES.map((valor) => (
                      <SelectItem key={valor} value={valor}>{categoryLabel(valor)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item-preco">Preco em moedas</Label>
                <Input
                  id="item-preco"
                  type="number"
                  min={0}
                  value={form.price_coins}
                  onChange={(e) => setForm({ ...form, price_coins: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="item-ordem">Ordem na loja</Label>
                <Input
                  id="item-ordem"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-icone">Icone (emoji)</Label>
              <Input
                id="item-icone"
                placeholder="🚀"
                value={form.icon ?? ''}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Disponivel para compra na loja</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStoreTab;