import { z } from 'zod';
import type { Json } from '@/integrations/supabase/types';

export interface PlatformSettingRow {
  key: string;
  value: Json;
  description: string | null;
  updated_at: string;
}

export type PlatformSettingsMap = Record<string, Json>;

export const ALLOWED_EMAIL_DOMAINS_KEY = 'allowed_email_domains';
export const QUIZ_DEFAULTS_KEY = 'quiz_defaults';
export const XP_REWARDS_KEY = 'xp_rewards';

/** Comportamento anterior ao ADMIN-007 (src/pages/Auth.tsx). */
export const DEFAULT_ALLOWED_EMAIL_DOMAINS = ['promobrindes.com.br'];

/** Comportamento anterior ao ADMIN-007 (src/components/admin/QuizManager.tsx). */
export const DEFAULT_QUIZ_DEFAULTS = {
  passing_score: 90,
  xp_reward: 50,
  cooldown_hours: 24,
  time_limit_seconds: null as number | null,
};

/** Comportamento anterior ao ADMIN-007 (src/pages/LessonPlayer.tsx). */
export const DEFAULT_XP_REWARDS = {
  lesson_completed: 25,
  course_completed: 100,
};

const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

export const normalizeDomain = (raw: string): string => raw.trim().toLowerCase().replace(/^@/, '');

/** Converte texto livre ("a.com, @b.com; c.com") em lista de domínios normalizados e únicos. */
export const parseDomainsInput = (raw: string): string[] => {
  const parsed = raw
    .split(/[\s,;]+/)
    .map(normalizeDomain)
    .filter((domain) => DOMAIN_PATTERN.test(domain));
  return Array.from(new Set(parsed));
};

export const domainsToInput = (domains: string[]): string => domains.join(', ');

const clampInt = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

const positiveIntOrNull = (value: unknown, max: number): number | null => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.trunc(parsed), max);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const allowedDomainsFrom = (value: unknown): string[] => {
  if (!Array.isArray(value)) return DEFAULT_ALLOWED_EMAIL_DOMAINS;
  const domains = Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map(normalizeDomain)
        .filter((domain) => DOMAIN_PATTERN.test(domain)),
    ),
  );
  return domains.length > 0 ? domains : DEFAULT_ALLOWED_EMAIL_DOMAINS;
};

export const isEmailAllowedByDomains = (email: string, domains: string[]): boolean => {
  const allowed = domains.length > 0 ? domains : DEFAULT_ALLOWED_EMAIL_DOMAINS;
  const at = email.lastIndexOf('@');
  if (at <= 0) return false;
  return allowed.includes(normalizeDomain(email.slice(at + 1)));
};

export const domainListMessage = (domains: string[]): string => {
  const allowed = domains.length > 0 ? domains : DEFAULT_ALLOWED_EMAIL_DOMAINS;
  return `Apenas emails ${allowed.map((domain) => `@${domain}`).join(', ')} são permitidos`;
};

/** Schema de e-mail da tela de login/cadastro, alimentado por platform_settings. */
export const createCorporateEmailSchema = (domains: string[]) =>
  z
    .string()
    .email('Email inválido')
    .refine((email) => isEmailAllowedByDomains(email, domains), () => ({
      message: domainListMessage(domains),
    }));

export const quizDefaultsFrom = (value: unknown) => {
  const record = asRecord(value);
  return {
    passing_score: clampInt(record.passing_score, DEFAULT_QUIZ_DEFAULTS.passing_score, 0, 100),
    xp_reward: clampInt(record.xp_reward, DEFAULT_QUIZ_DEFAULTS.xp_reward, 0, 10000),
    cooldown_hours: clampInt(record.cooldown_hours, DEFAULT_QUIZ_DEFAULTS.cooldown_hours, 0, 720),
    time_limit_seconds: positiveIntOrNull(record.time_limit_seconds, 86400),
  };
};

export const xpRewardsFrom = (value: unknown) => {
  const record = asRecord(value);
  return {
    lesson_completed: clampInt(record.lesson_completed, DEFAULT_XP_REWARDS.lesson_completed, 0, 10000),
    course_completed: clampInt(record.course_completed, DEFAULT_XP_REWARDS.course_completed, 0, 10000),
  };
};

export const settingsMapFrom = (rows: PlatformSettingRow[]): PlatformSettingsMap =>
  rows.reduce<PlatformSettingsMap>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

const domainSchema = z
  .string()
  .transform(normalizeDomain)
  .refine((domain) => DOMAIN_PATTERN.test(domain), 'Domínio inválido');

export const platformSettingsSchema = z.object({
  allowed_email_domains: z.array(domainSchema).min(1, 'Informe pelo menos um domínio'),
  quiz_defaults: z.object({
    passing_score: z.number().int('Use número inteiro').min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    xp_reward: z.number().int('Use número inteiro').min(0, 'Mínimo 0').max(10000, 'Máximo 10000'),
    cooldown_hours: z.number().int('Use número inteiro').min(0, 'Mínimo 0').max(720, 'Máximo 720'),
  }),
  xp_rewards: z.object({
    lesson_completed: z.number().int('Use número inteiro').min(0, 'Mínimo 0').max(10000, 'Máximo 10000'),
    course_completed: z.number().int('Use número inteiro').min(0, 'Mínimo 0').max(10000, 'Máximo 10000'),
  }),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>;
