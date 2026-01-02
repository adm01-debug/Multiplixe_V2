// 📧 EMAIL TEMPLATES - HTML PROFISSIONAIS
// Arquivo: lib/email-templates.ts

export interface EmailTemplateData {
  title: string;
  message: string;
  userName?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority?: number;
  category?: string;
  sourceSystem?: string;
  timestamp?: string;
}

// ========================================
// TEMPLATE BASE
// ========================================
const baseTemplate = (content: string, data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: #3b82f6;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .badge-urgent { background-color: #fee2e2; color: #991b1b; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-info { background-color: #dbeafe; color: #1e40af; }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px 15px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 ${data.title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Você está recebendo este email porque está inscrito nas notificações do sistema.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #6b7280;">Gerenciar preferências de notificações</a></p>
      <p style="margin-top: 15px; font-size: 11px;">© ${new Date().getFullYear()} Promo Brindes. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

// ========================================
// TEMPLATE: APROVAÇÃO URGENTE
// ========================================
export const approvalTemplate = (data: EmailTemplateData) => {
  const content = `
    <div class="badge badge-urgent">⚠️ Aprovação Urgente</div>
    <h2 style="color: #111827; margin-top: 10px;">${data.title}</h2>
    <p style="color: #374151; font-size: 16px;">${data.message}</p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #991b1b;">⏰ Ação necessária:</strong>
      <p style="color: #991b1b; margin: 5px 0 0 0;">Esta solicitação requer sua aprovação o mais rápido possível.</p>
    </div>
    
    ${data.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionLabel || 'Aprovar/Rejeitar'}</a>
      </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Sistema:</strong> ${data.sourceSystem || 'N/A'}<br>
        <strong>Data:</strong> ${data.timestamp || new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;
  return baseTemplate(content, data);
};

// ========================================
// TEMPLATE: ALERTA/AVISO
// ========================================
export const alertTemplate = (data: EmailTemplateData) => {
  const content = `
    <div class="badge badge-warning">⚠️ Alerta</div>
    <h2 style="color: #111827; margin-top: 10px;">${data.title}</h2>
    <p style="color: #374151; font-size: 16px;">${data.message}</p>
    
    ${data.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionLabel || 'Ver Detalhes'}</a>
      </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Sistema:</strong> ${data.sourceSystem || 'N/A'}<br>
        <strong>Data:</strong> ${data.timestamp || new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;
  return baseTemplate(content, data);
};

// ========================================
// TEMPLATE: INFORMAÇÃO
// ========================================
export const infoTemplate = (data: EmailTemplateData) => {
  const content = `
    <div class="badge badge-info">ℹ️ Informação</div>
    <h2 style="color: #111827; margin-top: 10px;">${data.title}</h2>
    <p style="color: #374151; font-size: 16px;">${data.message}</p>
    
    ${data.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionLabel || 'Ver Mais'}</a>
      </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Sistema:</strong> ${data.sourceSystem || 'N/A'}<br>
        <strong>Data:</strong> ${data.timestamp || new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;
  return baseTemplate(content, data);
};

// ========================================
// TEMPLATE: SUCESSO
// ========================================
export const successTemplate = (data: EmailTemplateData) => {
  const content = `
    <div class="badge badge-success">✅ Sucesso</div>
    <h2 style="color: #111827; margin-top: 10px;">${data.title}</h2>
    <p style="color: #374151; font-size: 16px;">${data.message}</p>
    
    ${data.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionLabel || 'Ver Detalhes'}</a>
      </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Sistema:</strong> ${data.sourceSystem || 'N/A'}<br>
        <strong>Data:</strong> ${data.timestamp || new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  `;
  return baseTemplate(content, data);
};

// ========================================
// TEMPLATE: DIGEST DIÁRIO
// ========================================
export const digestTemplate = (notifications: any[], userName: string) => {
  const grouped = notifications.reduce((acc, notif) => {
    const system = notif.source_system || 'Sistema';
    if (!acc[system]) acc[system] = [];
    acc[system].push(notif);
    return acc;
  }, {} as Record<string, any[]>);

  const systemsHtml = Object.entries(grouped)
    .map(([system, notifs]) => `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #111827; text-transform: capitalize; margin-bottom: 15px;">
          ${system} (${notifs.length})
        </h3>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
          ${notifs.slice(0, 5).map(n => `
            <div style="padding: 10px; background-color: white; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">
              <strong style="color: #111827;">${n.title}</strong><br>
              <span style="color: #6b7280; font-size: 14px;">${n.message}</span><br>
              <span style="color: #9ca3af; font-size: 12px;">${new Date(n.created_at).toLocaleString('pt-BR')}</span>
            </div>
          `).join('')}
          ${notifs.length > 5 ? `
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 10px 0 0 0;">
              ... e mais ${notifs.length - 5} notificações
            </p>
          ` : ''}
        </div>
      </div>
    `).join('');

  const content = `
    <div class="badge badge-info">📬 Resumo Diário</div>
    <h2 style="color: #111827; margin-top: 10px;">Olá, ${userName}!</h2>
    <p style="color: #374151; font-size: 16px;">
      Você tem <strong>${notifications.length} notificações</strong> não lidas nas últimas 24 horas.
    </p>
    
    <div style="margin: 30px 0;">
      ${systemsHtml}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://app.promobrindes.com.br/notifications" class="button">
        Ver Todas as Notificações
      </a>
    </div>
  `;

  return baseTemplate(content, {
    title: `📬 Resumo Diário - ${notifications.length} notificações`,
    message: '',
    userName,
  });
};

// ========================================
// SELETOR DE TEMPLATE
// ========================================
export function getEmailTemplate(type: string, data: EmailTemplateData): string {
  switch (type) {
    case 'urgent':
    case 'approval':
      return approvalTemplate(data);
    
    case 'warning':
    case 'error':
      return alertTemplate(data);
    
    case 'success':
      return successTemplate(data);
    
    case 'info':
    default:
      return infoTemplate(data);
  }
}
