import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Package, Receipt, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/SimpleEmptyState';
import DynamicSEO from '@/components/seo/DynamicSEO';
import { usePurchaseItem, useStoreItems, useWallet, type StoreItem } from '@/hooks/useWallet';
import {
  STORE_CATEGORIES,
  canAfford,
  categoryClass,
  categoryLabel,
  formatCoins,
  shortfall,
  walletSourceLabel,
} from '@/lib/store';

const TODAS = 'todas';

const formatarData = (valor: string | null) => {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const Store = () => {
  const navigate = useNavigate();
  const { data: carteira, isLoading: carregandoCarteira } = useWallet();
  const { data: itens = [], isLoading: carregandoItens } = useStoreItems();
  const comprar = usePurchaseItem();
  const [categoria, setCategoria] = useState<string>(TODAS);

  const coins = carteira?.coins ?? 0;

  const catalogo = useMemo(
    () => (categoria === TODAS ? itens : itens.filter((item) => item.category === categoria)),
    [itens, categoria],
  );

  const categoriasDisponiveis = useMemo(() => {
    const usadas = new Set(itens.map((item) => item.category));
    return STORE_CATEGORIES.filter((valor) => usadas.has(valor));
  }, [itens]);

  const comprarItem = (item: StoreItem) => comprar.mutate(item.id);

  return (
    <div className="min-h-screen bg-background">
      <DynamicSEO title="Loja de Recompensas" description="Troque as moedas conquistadas por power-ups, temas, avatares e itens cosmeticos." />
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" /> Loja de Recompensas
            </h1>
            <p className="text-sm text-muted-foreground">
              Troque moedas por melhorias. Voce ganha 1 moeda a cada 10 XP e 5 ou mais por conquista desbloqueada.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Meu saldo</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              <Coins className="h-6 w-6" />
              {carregandoCarteira ? '...' : formatCoins(coins)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ganhei nesta semana</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {carregandoCarteira ? '...' : formatCoins(carteira?.ganho_semana ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Gastei nesta semana</p>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {carregandoCarteira ? '...' : formatCoins(carteira?.gasto_semana ?? 0)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="catalogo">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalogo"><ShoppingBag className="h-4 w-4 mr-1.5 inline-block align-middle" />Loja</TabsTrigger>
            <TabsTrigger value="colecao"><Package className="h-4 w-4 mr-1.5 inline-block align-middle" />Minha coleção</TabsTrigger>
            <TabsTrigger value="extrato"><Receipt className="h-4 w-4 mr-1.5 inline-block align-middle" />Extrato</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo" className="mt-4 space-y-4">
            {categoriasDisponiveis.length > 1 && (
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-[220px]" aria-label="Filtrar itens por categoria">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas as categorias</SelectItem>
                  {categoriasDisponiveis.map((valor) => (
                    <SelectItem key={valor} value={valor}>{categoryLabel(valor)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {carregandoItens ? (
              <p className="text-sm text-muted-foreground">Carregando a loja...</p>
            ) : catalogo.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Nenhum item disponivel"
                description="Os itens da loja ainda nao foram cadastrados. Volte em breve para trocar suas moedas."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {catalogo.map((item) => {
                  const da = canAfford(coins, item.price_coins);
                  return (
                    <div key={item.id} className="flex flex-col rounded-2xl border border-border/60 bg-card/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                          {item.icon || '🎁'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold leading-tight">{item.name}</h3>
                          <Badge variant="outline" className={`mt-1 ${categoryClass(item.category)}`}>
                            {categoryLabel(item.category)}
                          </Badge>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                          <Coins className="h-4 w-4" />{formatCoins(item.price_coins)}
                        </span>
                        <Button
                          size="sm"
                          disabled={!da || comprar.isPending}
                          onClick={() => comprarItem(item)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-1.5" />
                          {da ? 'Comprar' : `Faltam ${formatCoins(shortfall(coins, item.price_coins))}`}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="colecao" className="mt-4">
            {(carteira?.colecao ?? []).length === 0 ? (
              <EmptyState
                icon={Package}
                title="Sua coleção esta vazia"
                description="Compre itens na loja para montar sua colecao e personalizar a plataforma."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(carteira?.colecao ?? []).map((item) => (
                  <div key={item.item_id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                      {item.icon || '🎁'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{categoryLabel(item.category)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Quantidade: {item.quantidade} · ultima compra em {formatarData(item.ultima_compra)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="extrato" className="mt-4">
            {(carteira?.extrato ?? []).length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhuma movimentacao ainda"
                description="Suas moedas ganhas e gastas aparecem aqui, com o saldo depois de cada movimentacao."
              />
            ) : (
              <div className="space-y-2">
                {(carteira?.extrato ?? []).map((movimento) => (
                  <div key={movimento.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{walletSourceLabel(movimento.source)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {movimento.description || 'Movimentacao de moedas'} · {formatarData(movimento.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${movimento.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {movimento.amount >= 0 ? '+' : ''}{formatCoins(movimento.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">saldo {formatCoins(movimento.balance_after)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          As moedas nao expiram e continuam acumulando mesmo quando voce ja esta no nivel maximo.
        </p>
      </div>
    </div>
  );
};

export default Store;