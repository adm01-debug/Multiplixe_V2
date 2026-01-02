import { supabase } from '@/integrations/supabase/client';

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  category?: 'approval' | 'alert' | 'reminder' | 'system' | 'social';
  sourceSystem: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  channels?: ('in_app' | 'email' | 'push' | 'sms' | 'whatsapp')[];
  priority?: 0 | 1 | 2 | 3;
  actionUrl?: string;
  actionLabel?: string;
  actionData?: any;
  scheduledFor?: string;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Helpers para notificações comuns
export const NotificationHelpers = {
  // Aprovação pendente
  approval: (userId: string, entityName: string, actionUrl: string, sourceSystem: string = 'system') =>
    sendNotification({
      userId,
      title: 'Nova Aprovação Pendente',
      message: `Você tem uma nova solicitação de aprovação: ${entityName}`,
      type: 'urgent',
      category: 'approval',
      sourceSystem,
      channels: ['in_app', 'email', 'push'],
      priority: 3,
      actionUrl,
      actionLabel: 'Aprovar/Rejeitar',
    }),

  // Alerta crítico (com SMS)
  criticalAlert: (userId: string, title: string, message: string, sourceSystem: string) =>
    sendNotification({
      userId,
      title,
      message,
      type: 'error',
      category: 'alert',
      sourceSystem,
      channels: ['in_app', 'push', 'sms', 'email'],
      priority: 3,
    }),

  // Alerta normal
  alert: (userId: string, title: string, message: string, sourceSystem: string) =>
    sendNotification({
      userId,
      title,
      message,
      type: 'warning',
      category: 'alert',
      sourceSystem,
      channels: ['in_app', 'push'],
      priority: 2,
    }),

  // Lembrete
  reminder: (userId: string, message: string, sourceSystem: string = 'system') =>
    sendNotification({
      userId,
      title: 'Lembrete',
      message,
      type: 'info',
      category: 'reminder',
      sourceSystem,
      channels: ['in_app', 'email'],
      priority: 1,
    }),

  // Notificação do sistema
  systemNotification: (userId: string, title: string, message: string) =>
    sendNotification({
      userId,
      title,
      message,
      type: 'info',
      category: 'system',
      sourceSystem: 'system',
      channels: ['in_app'],
      priority: 0,
    }),

  // Sucesso
  success: (userId: string, title: string, message: string, sourceSystem: string) =>
    sendNotification({
      userId,
      title,
      message,
      type: 'success',
      category: 'system',
      sourceSystem,
      channels: ['in_app'],
      priority: 0,
    }),

  // WhatsApp direto
  whatsapp: (userId: string, title: string, message: string, sourceSystem: string) =>
    sendNotification({
      userId,
      title,
      message,
      type: 'info',
      category: 'social',
      sourceSystem,
      channels: ['whatsapp'],
      priority: 1,
    }),

  // Finance Hub - Aprovação urgente de lançamento
  financeApproval: (userId: string, lancamentoId: string, valor: string) =>
    sendNotification({
      userId,
      title: 'Aprovação Urgente - Lançamento Financeiro',
      message: `Lançamento #${lancamentoId} aguarda sua aprovação. Valor: ${valor}`,
      type: 'urgent',
      category: 'approval',
      sourceSystem: 'finance',
      sourceEntityType: 'lancamento',
      sourceEntityId: lancamentoId,
      channels: ['in_app', 'email', 'push', 'sms'],
      priority: 3,
      actionUrl: `/finance/lancamentos/${lancamentoId}`,
      actionLabel: 'Aprovar/Rejeitar',
    }),

  // Compras - Pedido aprovado
  purchaseApproved: (userId: string, pedidoId: string) =>
    sendNotification({
      userId,
      title: 'Pedido Aprovado',
      message: `Seu pedido #${pedidoId} foi aprovado!`,
      type: 'success',
      category: 'approval',
      sourceSystem: 'compras',
      sourceEntityType: 'pedido',
      sourceEntityId: pedidoId,
      channels: ['in_app', 'email'],
      priority: 1,
      actionUrl: `/compras/pedidos/${pedidoId}`,
      actionLabel: 'Ver Pedido',
    }),

  // WMS - Estoque baixo
  lowStock: (userId: string, produtoNome: string, quantidade: number) =>
    sendNotification({
      userId,
      title: 'Alerta de Estoque Baixo',
      message: `${produtoNome}: apenas ${quantidade} unidades em estoque`,
      type: 'warning',
      category: 'alert',
      sourceSystem: 'wms',
      channels: ['in_app', 'email', 'push'],
      priority: 2,
    }),

  // SalesPro - Nova oportunidade
  newOpportunity: (userId: string, clienteNome: string, valor: string) =>
    sendNotification({
      userId,
      title: 'Nova Oportunidade',
      message: `${clienteNome} - ${valor}`,
      type: 'info',
      category: 'social',
      sourceSystem: 'salespro',
      channels: ['in_app', 'push'],
      priority: 1,
    }),

  // Match ATS - Novo candidato
  newCandidate: (userId: string, candidatoNome: string, vagaNome: string) =>
    sendNotification({
      userId,
      title: 'Novo Candidato',
      message: `${candidatoNome} se candidatou para ${vagaNome}`,
      type: 'info',
      category: 'social',
      sourceSystem: 'match',
      channels: ['in_app', 'email'],
      priority: 1,
    }),
};
