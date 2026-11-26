import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatCoins, priceChangedNotice, type StoreCategory } from '@/lib/store';

export interface WalletEntry {
  id: string;
  amount: number;
  balance_after: number;
  source: string | null;
  description: string | null;
  created_at: string;
}

export interface WalletCollectionItem {
  item_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  quantidade: number;
  ultima_compra: string | null;
}

export interface Wallet {
  coins: number;
  ganho_semana: number;
  gasto_semana: number;
  extrato: WalletEntry[];
  colecao: WalletCollectionItem[];
}

export interface StoreItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price_coins: number;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseResult {
  ok: boolean;
  mensagem: string;
  coins?: number;
  preco?: number;
  faltam?: number;
  item?: StoreItem | null;
}

export interface StoreItemInput {
  id?: string;
  slug: string;
  name: string;
  description: string | null;
  category: StoreCategory;
  price_coins: number;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

const CARTEIRA_VAZIA: Wallet = { coins: 0, ganho_semana: 0, gasto_semana: 0, extrato: [], colecao: [] };

export const useWallet = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wallet', user?.id ?? null],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<Wallet> => {
      const { data, error } = await supabase.rpc('get_my_wallet');
      if (error) throw error;
      const raw = (data ?? {}) as unknown as Partial<Wallet>;
      return {
        ...CARTEIRA_VAZIA,
        ...raw,
        coins: raw.coins ?? 0,
        ganho_semana: raw.ganho_semana ?? 0,
        gasto_semana: raw.gasto_semana ?? 0,
        extrato: raw.extrato ?? [],
        colecao: raw.colecao ?? [],
      };
    },
  });
};

export const useStoreItems = () =>
  useQuery({
    queryKey: ['store', 'items'],
    queryFn: async (): Promise<StoreItem[]> => {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as StoreItem[];
    },
  });

export const useAdminStoreItems = () =>
  useQuery({
    queryKey: ['store', 'admin-items'],
    queryFn: async (): Promise<StoreItem[]> => {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as StoreItem[];
    },
  });

export interface PurchaseInput {
  id: string;
  /** Preco que o aluno viu na vitrine; usado para avisar se o catalogo mudou. */
  expectedPrice?: number;
}

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PurchaseInput): Promise<PurchaseResult> => {
      const { data, error } = await supabase.rpc('purchase_store_item', { p_item_id: input.id });
      if (error) throw error;
      return (data ?? { ok: false, mensagem: 'Nao foi possivel concluir a compra' }) as unknown as PurchaseResult;
    },
    onSuccess: (resultado, input) => {
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        const aviso = priceChangedNotice(input.expectedPrice, resultado.item?.price_coins);
        if (aviso) toast.warning(aviso);
        void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        void queryClient.invalidateQueries({ queryKey: ['store'] });
      } else {
        toast.error(resultado.mensagem);
      }
    },
    onError: () => toast.error('Nao foi possivel concluir a compra. Tente novamente.'),
  });
};

export const useSaveStoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StoreItemInput) => {
      const payload = {
        slug: input.slug.trim(),
        name: input.name.trim(),
        description: input.description?.trim() ? input.description.trim() : null,
        category: input.category,
        price_coins: input.price_coins,
        icon: input.icon?.trim() ? input.icon.trim() : null,
        is_active: input.is_active,
        sort_order: input.sort_order,
      };
      if (input.id) {
        const { error } = await supabase.from('store_items').update(payload).eq('id', input.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('store_items').insert(payload);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      toast.success(input.id ? 'Item atualizado' : 'Item criado');
      void queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (error: Error) =>
      toast.error(
        error.message.includes('duplicate')
          ? 'Ja existe um item com esse identificador'
          : 'Nao foi possivel salvar o item',
      ),
  });
};

export const useToggleStoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('store_items').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      toast.success(input.is_active ? 'Item disponivel na loja' : 'Item retirado da loja');
      void queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: () => toast.error('Nao foi possivel alterar o item'),
  });
};

export const useDeleteStoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item excluido');
      void queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (error: Error) =>
      toast.error(
        error.message.includes('violates foreign key')
          ? 'Existem compras registradas para este item - desative-o em vez de excluir'
          : 'Nao foi possivel excluir o item',
      ),
  });
};

export const useGrantCoins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; amount: number; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_grant_coins', {
        p_user_id: input.userId,
        p_amount: input.amount,
        p_reason: input.reason,
      });
      if (error) throw error;
      return data as unknown as { coins: number; amount: number; source: string; user_id: string };
    },
    onSuccess: (resultado) => {
      toast.success(`${formatCoins(resultado.amount)} creditadas ao aluno`);
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: () => toast.error('Nao foi possivel creditar moedas'),
  });
};
