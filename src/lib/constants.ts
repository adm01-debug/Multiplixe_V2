/**
 * Valores compartilhados do front (REF-005).
 *
 * So entra aqui o que e do front e usado em mais de um lugar. XP, moedas e regras de gamificacao
 * vivem no banco (public.add_user_xp, public.xp_multiplier_for, platform_settings) — duplicar esses
 * numeros aqui criaria uma segunda fonte de verdade.
 */

/**
 * Dominio publico usado em canonical, Open Graph e JSON-LD.
 * Trocar de dominio = definir VITE_SITE_URL no ambiente (ou esta constante).
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://multiplixe-v2.vercel.app").replace(/\/+$/, "");
