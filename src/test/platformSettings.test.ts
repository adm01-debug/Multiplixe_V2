import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ALLOWED_EMAIL_DOMAINS,
  DEFAULT_QUIZ_DEFAULTS,
  DEFAULT_XP_REWARDS,
  allowedDomainsFrom,
  createCorporateEmailSchema,
  domainListMessage,
  parseDomainsInput,
  quizDefaultsFrom,
  mensagemErroCadastro,
  settingsMapFrom,
  xpRewardsFrom,
} from '@/lib/platformSettings';

describe('platformSettings', () => {
  describe('allowedDomainsFrom', () => {
    it('normaliza maiúsculas, @ inicial e duplicatas', () => {
      expect(allowedDomainsFrom(['@Promobrindes.com.br', 'promobrindes.com.br', 'outra.com.br'])).toEqual([
        'promobrindes.com.br',
        'outra.com.br',
      ]);
    });

    it('cai no padrão antigo quando o valor é inválido', () => {
      expect(allowedDomainsFrom(undefined)).toEqual(DEFAULT_ALLOWED_EMAIL_DOMAINS);
      expect(allowedDomainsFrom(['sem-ponto'])).toEqual(DEFAULT_ALLOWED_EMAIL_DOMAINS);
      expect(allowedDomainsFrom('promobrindes.com.br')).toEqual(DEFAULT_ALLOWED_EMAIL_DOMAINS);
    });
  });

  describe('parseDomainsInput', () => {
    it('aceita vírgula, espaço e ponto-e-vírgula', () => {
      expect(parseDomainsInput('promobrindes.com.br, @outra.com.br; terceira.com.br')).toEqual([
        'promobrindes.com.br',
        'outra.com.br',
        'terceira.com.br',
      ]);
    });

    it('descarta lixo digitado', () => {
      expect(parseDomainsInput('promobrindes.com.br, nao-vale, ..')).toEqual(['promobrindes.com.br']);
    });
  });

  describe('createCorporateEmailSchema', () => {
    it('aceita e-mail do domínio configurado', () => {
      expect(createCorporateEmailSchema(['promobrindes.com.br']).safeParse('user@promobrindes.com.br').success).toBe(true);
    });

    it('rejeita domínio fora da lista com a mensagem antiga preservada', () => {
      const result = createCorporateEmailSchema(['promobrindes.com.br']).safeParse('user@gmail.com');
      expect(result.success).toBe(false);
      expect(result.success ? '' : result.error.errors[0].message).toBe('Apenas emails @promobrindes.com.br são permitidos');
    });

    it('aceita novo domínio assim que ele é configurado', () => {
      const schema = createCorporateEmailSchema(['promobrindes.com.br', 'outraempresa.com']);
      expect(schema.safeParse('user@outraempresa.com').success).toBe(true);
      expect(schema.safeParse('user@gmail.com').success).toBe(false);
    });

    it('ignora caixa e subdomínio falso', () => {
      const schema = createCorporateEmailSchema(['promobrindes.com.br']);
      expect(schema.safeParse('User@Promobrindes.com.br').success).toBe(true);
      expect(schema.safeParse('user@fakepromobrindes.com.br').success).toBe(false);
    });

    it('domainListMessage lista todos os domínios', () => {
      expect(domainListMessage(['a.com', 'b.com'])).toBe('Apenas emails @a.com, @b.com são permitidos');
    });
  });

  describe('quizDefaultsFrom', () => {
    it('usa o padrão antigo quando não há valor', () => {
      expect(quizDefaultsFrom(undefined)).toEqual(DEFAULT_QUIZ_DEFAULTS);
    });

    it('limita valores fora da faixa', () => {
      const parsed = quizDefaultsFrom({ passing_score: 500, xp_reward: -10, cooldown_hours: 9999, time_limit_seconds: 0 });
      expect(parsed).toEqual({ passing_score: 100, xp_reward: 0, cooldown_hours: 720, time_limit_seconds: null });
    });

    it('mantém valores válidos e converte string numérica', () => {
      expect(quizDefaultsFrom({ passing_score: '70', xp_reward: 30, cooldown_hours: 12, time_limit_seconds: 600 })).toEqual({
        passing_score: 70,
        xp_reward: 30,
        cooldown_hours: 12,
        time_limit_seconds: 600,
      });
    });
  });

  describe('xpRewardsFrom', () => {
    it('usa o padrão antigo quando não há valor', () => {
      expect(xpRewardsFrom({})).toEqual(DEFAULT_XP_REWARDS);
    });

    it('respeita valores configurados', () => {
      expect(xpRewardsFrom({ lesson_completed: 40, course_completed: 250 })).toEqual({
        lesson_completed: 40,
        course_completed: 250,
      });
    });
  });

  describe('settingsMapFrom', () => {
    it('indexa as linhas por chave', () => {
      const map = settingsMapFrom([
        { key: 'allowed_email_domains', value: ['a.com'], description: null, updated_at: '2026-11-25T00:00:00Z' },
        { key: 'xp_rewards', value: { lesson_completed: 1, course_completed: 2 }, description: null, updated_at: '2026-11-25T00:00:00Z' },
      ]);
      expect(Object.keys(map)).toEqual(['allowed_email_domains', 'xp_rewards']);
    });
  });

  describe('mensagemErroCadastro', () => {
    it('traduz o bloqueio do gate de domínio do banco', () => {
      expect(
        mensagemErroCadastro('Cadastro restrito a email corporativo (promobrindes.com.br).', ['promobrindes.com.br']),
      ).toBe('Cadastro restrito. Apenas emails @promobrindes.com.br são permitidos.');
    });

    it('mantém o aviso de email já cadastrado', () => {
      expect(mensagemErroCadastro('User already registered', ['promobrindes.com.br'])).toBe(
        'Este email já está cadastrado.',
      );
    });

    it('usa mensagem genérica para os demais erros', () => {
      expect(mensagemErroCadastro('Database error saving new user', ['promobrindes.com.br'])).toBe(
        'Erro ao criar conta.',
      );
    });
  });
});
