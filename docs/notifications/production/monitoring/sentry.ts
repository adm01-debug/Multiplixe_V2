// 📊 MONITORAMENTO E OBSERVABILIDADE
// Arquivo: lib/monitoring.ts
// Integração com Sentry para error tracking

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// ========================================
// INICIALIZAÇÃO SENTRY
// ========================================
export function initMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% em produção
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% das sessões
      replaysOnErrorSampleRate: 1.0, // 100% dos erros
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION,
      environment: import.meta.env.MODE,
      
      // Ignore specific errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      
      // Enriquecer contexto
      beforeSend(event, hint) {
        // Adicionar contexto extra
        if (event.user) {
          event.user.segment = 'notifications-user';
        }
        return event;
      },
    });
  }
}

// ========================================
// TRACKING DE EVENTOS
// ========================================
export const NotificationEvents = {
  SENT: 'notification.sent',
  DELIVERED: 'notification.delivered',
  FAILED: 'notification.failed',
  OPENED: 'notification.opened',
  CLICKED: 'notification.clicked',
  DISMISSED: 'notification.dismissed',
} as const;

export function trackEvent(
  event: string,
  properties?: Record<string, any>
) {
  // Sentry custom event
  Sentry.addBreadcrumb({
    category: 'notification',
    message: event,
    level: 'info',
    data: properties,
  });

  // Analytics (se tiver)
  if (window.analytics) {
    window.analytics.track(event, properties);
  }

  // Console em dev
  if (import.meta.env.DEV) {
    console.log('📊 Event:', event, properties);
  }
}

// ========================================
// ERROR TRACKING
// ========================================
export function captureError(
  error: Error,
  context?: Record<string, any>
) {
  console.error('❌ Error captured:', error);
  
  Sentry.captureException(error, {
    contexts: {
      notification: context,
    },
    tags: {
      feature: 'notifications',
      ...context?.tags,
    },
  });
}

// ========================================
// PERFORMANCE MONITORING
// ========================================
export function measurePerformance(
  name: string,
  operation: () => Promise<any>
) {
  const transaction = Sentry.startTransaction({
    name,
    op: 'notification.operation',
  });

  return operation()
    .then((result) => {
      transaction.setStatus('ok');
      transaction.finish();
      return result;
    })
    .catch((error) => {
      transaction.setStatus('error');
      transaction.finish();
      throw error;
    });
}

// ========================================
// USER CONTEXT
// ========================================
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    segment: user.role,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

// ========================================
// CUSTOM METRICS
// ========================================
export class NotificationMetrics {
  private static metrics: Map<string, number> = new Map();

  static increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
    
    // Enviar para Sentry como custom metric
    Sentry.metrics.increment(metric, value, {
      tags: { feature: 'notifications' },
    });
  }

  static gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
    
    Sentry.metrics.gauge(metric, value, {
      tags: { feature: 'notifications' },
    });
  }

  static distribution(metric: string, value: number) {
    Sentry.metrics.distribution(metric, value, {
      tags: { feature: 'notifications' },
    });
  }

  static getAll(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static reset() {
    this.metrics.clear();
  }
}

// ========================================
// LOGS ESTRUTURADOS
// ========================================
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
}

export class Logger {
  private static buffer: LogEntry[] = [];
  private static maxBufferSize = 100;

  static log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Buffer logs
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Console
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    console[level](emoji[level], message, context);

    // Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: 'log',
      message,
      level: level as any,
      data: context,
    });

    // Se for erro, capturar
    if (level === LogLevel.ERROR && context?.error) {
      captureError(context.error, context);
    }
  }

  static debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  static info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  static warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  static error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  static getLogs(): LogEntry[] {
    return [...this.buffer];
  }

  static clearLogs() {
    this.buffer = [];
  }

  // Exportar logs para debug
  static exportLogs(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}

// ========================================
// HEALTH CHECK
// ========================================
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  latency: number;
}> {
  const start = Date.now();
  const checks: Record<string, boolean> = {};

  try {
    // Check Supabase
    checks.supabase = await checkSupabase();
    
    // Check Resend
    checks.email = await checkEmail();
    
    // Check Twilio
    checks.sms = await checkTwilio();
    
    // Check Service Worker
    checks.serviceWorker = 'serviceWorker' in navigator;
    
    // Check Push API
    checks.push = 'Notification' in window;

    const latency = Date.now() - start;
    const healthy = Object.values(checks).every(Boolean);
    const degraded = Object.values(checks).some(Boolean);

    return {
      status: healthy ? 'healthy' : degraded ? 'degraded' : 'unhealthy',
      checks,
      latency,
    };
  } catch (error) {
    Logger.error('Health check failed', { error });
    return {
      status: 'unhealthy',
      checks,
      latency: Date.now() - start,
    };
  }
}

async function checkSupabase(): Promise<boolean> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.from('notifications').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkEmail(): Promise<boolean> {
  // Verificar se RESEND_API_KEY está configurado
  return !!import.meta.env.VITE_RESEND_API_KEY;
}

async function checkTwilio(): Promise<boolean> {
  // Verificar se credenciais Twilio estão configuradas
  return !!(
    import.meta.env.VITE_TWILIO_ACCOUNT_SID &&
    import.meta.env.VITE_TWILIO_AUTH_TOKEN
  );
}

// ========================================
// ALERTAS
// ========================================
export function sendAlert(
  severity: 'info' | 'warning' | 'critical',
  message: string,
  details?: Record<string, any>
) {
  Logger.warn(`🚨 Alert [${severity}]: ${message}`, details);
  
  // Enviar para Sentry como issue
  if (severity === 'critical') {
    Sentry.captureMessage(message, {
      level: 'error',
      tags: { severity, alert: true },
      contexts: { details },
    });
  }

  // Webhook para Slack (se configurado)
  if (import.meta.env.VITE_SLACK_WEBHOOK_URL) {
    fetch(import.meta.env.VITE_SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${severity.toUpperCase()}: ${message}`,
        attachments: [
          {
            color: severity === 'critical' ? 'danger' : 'warning',
            fields: Object.entries(details || {}).map(([k, v]) => ({
              title: k,
              value: String(v),
              short: true,
            })),
          },
        ],
      }),
    }).catch(() => {
      // Silenciar erros de webhook
    });
  }
}

// Exportar tudo
export default {
  initMonitoring,
  trackEvent,
  captureError,
  measurePerformance,
  setUserContext,
  clearUserContext,
  NotificationMetrics,
  Logger,
  healthCheck,
  sendAlert,
};
