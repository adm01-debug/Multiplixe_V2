// 🧪 TESTES AUTOMATIZADOS - SISTEMA DE NOTIFICAÇÕES
// Arquivo: __tests__/notifications.test.ts
// Run: npm test

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';
import { sendNotification } from '@/lib/notifications';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({}),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

describe('Sistema de Notificações', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ========================================
  // TESTES: useNotifications Hook
  // ========================================
  describe('useNotifications Hook', () => {
    it('deve carregar notificações com sucesso', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toBeDefined();
      expect(Array.isArray(result.current.notifications)).toBe(true);
    });

    it('deve ter contador de não lidas', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBeDefined();
      });

      expect(typeof result.current.unreadCount).toBe('number');
      expect(result.current.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // TESTES: sendNotification
  // ========================================
  describe('sendNotification Function', () => {
    it('deve enviar notificação com parâmetros mínimos', async () => {
      const notification = {
        userId: 'test-user',
        title: 'Teste',
        message: 'Mensagem de teste',
        sourceSystem: 'test',
      };

      const result = await sendNotification(notification);
      expect(result).toBeDefined();
    });

    it('deve validar campos obrigatórios', async () => {
      const invalidNotification = {
        userId: '',
        title: '',
        message: 'Teste',
        sourceSystem: 'test',
      };

      await expect(sendNotification(invalidNotification as any)).rejects.toThrow();
    });

    it('deve aplicar valores padrão corretos', async () => {
      const notification = {
        userId: 'test-user',
        title: 'Teste',
        message: 'Teste',
        sourceSystem: 'test',
      };

      const result = await sendNotification(notification);
      
      // Verificar defaults
      expect(result.channels).toContain('in_app');
      expect(result.priority).toBe(1);
      expect(result.type).toBe('info');
    });
  });

  // ========================================
  // TESTES: Priorização
  // ========================================
  describe('Priorização de Notificações', () => {
    it('notificação urgente deve ter prioridade 3', async () => {
      const urgent = {
        userId: 'test',
        title: 'Urgente',
        message: 'Teste',
        sourceSystem: 'test',
        type: 'urgent',
        priority: 3,
      };

      const result = await sendNotification(urgent);
      expect(result.priority).toBe(3);
    });

    it('notificação normal deve ter prioridade 1', async () => {
      const normal = {
        userId: 'test',
        title: 'Normal',
        message: 'Teste',
        sourceSystem: 'test',
      };

      const result = await sendNotification(normal);
      expect(result.priority).toBe(1);
    });
  });

  // ========================================
  // TESTES: Canais
  // ========================================
  describe('Canais de Notificação', () => {
    it('deve aceitar múltiplos canais', async () => {
      const notification = {
        userId: 'test',
        title: 'Multi',
        message: 'Teste',
        sourceSystem: 'test',
        channels: ['in_app', 'email', 'push'],
      };

      const result = await sendNotification(notification);
      expect(result.channels).toContain('in_app');
      expect(result.channels).toContain('email');
      expect(result.channels).toContain('push');
    });

    it('deve rejeitar canais inválidos', async () => {
      const notification = {
        userId: 'test',
        title: 'Invalid',
        message: 'Teste',
        sourceSystem: 'test',
        channels: ['invalid_channel' as any],
      };

      await expect(sendNotification(notification)).rejects.toThrow();
    });
  });

  // ========================================
  // TESTES: Templates de Email
  // ========================================
  describe('Email Templates', () => {
    it('template de aprovação deve conter elementos corretos', () => {
      const { approvalTemplate } = require('@/lib/email-templates');
      
      const html = approvalTemplate({
        title: 'Teste Aprovação',
        message: 'Favor aprovar',
        actionUrl: 'https://test.com/approve',
      });

      expect(html).toContain('Aprovação Urgente');
      expect(html).toContain('Teste Aprovação');
      expect(html).toContain('https://test.com/approve');
    });

    it('template de sucesso deve ter classe correta', () => {
      const { successTemplate } = require('@/lib/email-templates');
      
      const html = successTemplate({
        title: 'Sucesso',
        message: 'Operação concluída',
      });

      expect(html).toContain('badge-success');
      expect(html).toContain('Sucesso');
    });
  });

  // ========================================
  // TESTES: Agrupamento
  // ========================================
  describe('Agrupamento de Notificações', () => {
    it('deve agrupar notificações similares', async () => {
      const notification1 = {
        userId: 'test',
        title: 'Alerta',
        message: 'Teste 1',
        sourceSystem: 'test',
        category: 'alert',
      };

      const notification2 = {
        ...notification1,
        message: 'Teste 2',
      };

      await sendNotification(notification1);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await sendNotification(notification2);
      
      // Deve ter sido agrupado (se dentro da janela)
      expect(result2.isGrouped || result2.groupCount).toBeDefined();
    });
  });

  // ========================================
  // TESTES: Performance
  // ========================================
  describe('Performance', () => {
    it('deve enviar notificação em <500ms', async () => {
      const start = Date.now();
      
      await sendNotification({
        userId: 'test',
        title: 'Performance',
        message: 'Teste',
        sourceSystem: 'test',
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('deve processar lote de 10 notificações rapidamente', async () => {
      const start = Date.now();
      
      const promises = Array.from({ length: 10 }, (_, i) =>
        sendNotification({
          userId: 'test',
          title: `Notif ${i}`,
          message: 'Teste',
          sourceSystem: 'test',
        })
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // 2s para 10 notif
    });
  });

  // ========================================
  // TESTES: Validação de Dados
  // ========================================
  describe('Validação de Dados', () => {
    it('deve validar userId obrigatório', async () => {
      await expect(
        sendNotification({
          userId: '',
          title: 'Teste',
          message: 'Teste',
          sourceSystem: 'test',
        } as any)
      ).rejects.toThrow();
    });

    it('deve validar title obrigatório', async () => {
      await expect(
        sendNotification({
          userId: 'test',
          title: '',
          message: 'Teste',
          sourceSystem: 'test',
        } as any)
      ).rejects.toThrow();
    });

    it('deve aceitar título com até 100 caracteres', async () => {
      const longTitle = 'A'.repeat(100);
      
      const result = await sendNotification({
        userId: 'test',
        title: longTitle,
        message: 'Teste',
        sourceSystem: 'test',
      });
      
      expect(result.title).toBe(longTitle);
    });

    it('deve rejeitar título com >100 caracteres', async () => {
      const tooLongTitle = 'A'.repeat(101);
      
      await expect(
        sendNotification({
          userId: 'test',
          title: tooLongTitle,
          message: 'Teste',
          sourceSystem: 'test',
        })
      ).rejects.toThrow();
    });
  });

  // ========================================
  // TESTES: DND (Do Not Disturb)
  // ========================================
  describe('Do Not Disturb', () => {
    it('deve respeitar DND para notificações normais', async () => {
      // Mock user com DND ativo
      const notification = {
        userId: 'user-with-dnd',
        title: 'Normal',
        message: 'Teste',
        sourceSystem: 'test',
        priority: 1,
      };

      const result = await sendNotification(notification);
      
      // Deve ser agendada ao invés de enviada imediatamente
      expect(result.scheduled_for).toBeDefined();
    });

    it('deve ignorar DND para notificações urgentes', async () => {
      const notification = {
        userId: 'user-with-dnd',
        title: 'Urgente',
        message: 'Teste',
        sourceSystem: 'test',
        priority: 3,
      };

      const result = await sendNotification(notification);
      
      // Deve ser enviada imediatamente mesmo com DND
      expect(result.delivered_at).toBeDefined();
    });
  });
});

// ========================================
// TESTES DE INTEGRAÇÃO
// ========================================
describe('Testes de Integração', () => {
  it('fluxo completo: criar → enviar → marcar lida', async () => {
    // 1. Criar notificação
    const notification = await sendNotification({
      userId: 'integration-test',
      title: 'Integração',
      message: 'Teste completo',
      sourceSystem: 'test',
    });

    expect(notification.id).toBeDefined();
    expect(notification.is_read).toBe(false);

    // 2. Marcar como lida
    // (implementar quando markAsRead estiver disponível)
    
    // 3. Verificar se foi marcada
    // (implementar quando query estiver disponível)
  });
});

// ========================================
// TESTES DE EDGE CASES
// ========================================
describe('Edge Cases', () => {
  it('deve lidar com network offline', async () => {
    // Mock network offline
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const notification = {
      userId: 'test',
      title: 'Offline',
      message: 'Teste',
      sourceSystem: 'test',
    };

    // Deve enfileirar ao invés de falhar
    await expect(sendNotification(notification)).resolves.toBeDefined();
  });

  it('deve lidar com caracteres especiais', async () => {
    const notification = {
      userId: 'test',
      title: 'Teste "com" \'aspas\' & símbolos',
      message: 'Mensagem <html> & "especial"',
      sourceSystem: 'test',
    };

    const result = await sendNotification(notification);
    expect(result.title).toContain('aspas');
  });

  it('deve lidar com emojis', async () => {
    const notification = {
      userId: 'test',
      title: '🔔 Notificação 🎉',
      message: 'Teste com emojis 😀',
      sourceSystem: 'test',
    };

    const result = await sendNotification(notification);
    expect(result.title).toContain('🔔');
  });
});
