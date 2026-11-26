export type StoreCategory = 'power_up' | 'theme' | 'avatar' | 'cosmetic';

export const STORE_CATEGORIES: StoreCategory[] = ['power_up', 'theme', 'avatar', 'cosmetic'];

export const STORE_CATEGORY_LABEL: Record<StoreCategory, string> = {
  power_up: 'Power-up',
  theme: 'Tema',
  avatar: 'Avatar',
  cosmetic: 'Cosmetico',
};

/** Rotulo de uma categoria de item da loja (aceita valores vindos do banco). */
export const categoryLabel = (value: string): string =>
  STORE_CATEGORY_LABEL[value as StoreCategory] ?? value;

const CLASSE_CATEGORIA: Record<string, string> = {
  power_up: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
  theme: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30 dark:text-fuchsia-400',
  avatar: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400',
  cosmetic: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
};

export const categoryClass = (value: string): string =>
  CLASSE_CATEGORIA[value] ?? 'bg-muted text-muted-foreground';

/** Marca de milhar manual para nao depender de ICU do runtime. */
export const formatNumber = (value: number): string => {
  const inteiro = Math.trunc(Number.isFinite(value) ? value : 0);
  const negativo = inteiro < 0;
  const texto = String(Math.abs(inteiro)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return negativo ? `-${texto}` : texto;
};

export const formatCoins = (value: number): string =>
  `${formatNumber(value)} ${Math.abs(value) === 1 ? 'moeda' : 'moedas'}`;

export const canAfford = (coins: number, price: number): boolean => coins >= price;

/** Quanto falta para comprar; 0 quando ja da para comprar. */
export const shortfall = (coins: number, price: number): number => Math.max(0, price - coins);

export const WALLET_SOURCE_LABEL: Record<string, string> = {
  xp: 'XP convertido',
  achievement: 'Conquista desbloqueada',
  purchase: 'Compra na loja',
  admin: 'Bonus do admin',
  manual: 'Ajuste manual',
};

export const walletSourceLabel = (value: string | null | undefined): string =>
  value ? WALLET_SOURCE_LABEL[value] ?? value : 'Movimentacao';