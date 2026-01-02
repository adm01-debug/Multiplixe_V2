// 🚦 RATE LIMITING E CONTROLE DE REQUISIÇÕES
// Arquivo: lib/rate-limit.ts

import { LRUCache } from 'lru-cache';

// ========================================
// CONFIGURAÇÃO DE LIMITES
// ========================================
export const RATE_LIMITS = {
  // Por usuário
  NOTIFICATIONS_PER_MINUTE: 10,
  NOTIFICATIONS_PER_HOUR: 100,
  NOTIFICATIONS_PER_DAY: 500,
  
  // Por sistema
  SYSTEM_PER_MINUTE: 100,
  SYSTEM_PER_HOUR: 1000,
  
  // Por canal
  EMAIL_PER_HOUR: 50,
  SMS_PER_DAY: 20,
  WHATSAPP_PER_DAY: 30,
  PUSH_PER_MINUTE: 5,
  
  // API calls
  API_CALLS_PER_SECOND: 10,
  API_CALLS_PER_MINUTE: 300,
} as const;

// ========================================
// RATE LIMITER CLASS
// ========================================
export class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new LRUCache({
      max: 10000, // Máximo de 10k usuários em cache
      ttl: windowMs,
    });
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const timestamps = this.cache.get(key) || [];
    
    // Remover timestamps antigos
    const validTimestamps = timestamps.filter(
      ts => now - ts < this.windowMs
    );

    const allowed = validTimestamps.length < this.limit;
    const remaining = Math.max(0, this.limit - validTimestamps.length);
    const oldestTimestamp = validTimestamps[0] || now;
    const resetAt = new Date(oldestTimestamp + this.windowMs);

    if (allowed) {
      validTimestamps.push(now);
      this.cache.set(key, validTimestamps);
    }

    return { allowed, remaining, resetAt };
  }

  reset(key: string) {
    this.cache.delete(key);
  }

  getStats(key: string) {
    const timestamps = this.cache.get(key) || [];
    const now = Date.now();
    const validTimestamps = timestamps.filter(
      ts => now - ts < this.windowMs
    );
    
    return {
      requests: validTimestamps.length,
      limit: this.limit,
      windowMs: this.windowMs,
      resetAt: validTimestamps[0]
        ? new Date(validTimestamps[0] + this.windowMs)
        : new Date(now + this.windowMs),
    };
  }
}

// ========================================
// INSTÂNCIAS PRÉ-CONFIGURADAS
// ========================================
export const rateLimiters = {
  perMinute: new RateLimiter(
    RATE_LIMITS.NOTIFICATIONS_PER_MINUTE,
    60 * 1000
  ),
  perHour: new RateLimiter(
    RATE_LIMITS.NOTIFICATIONS_PER_HOUR,
    60 * 60 * 1000
  ),
  perDay: new RateLimiter(
    RATE_LIMITS.NOTIFICATIONS_PER_DAY,
    24 * 60 * 60 * 1000
  ),
  emailPerHour: new RateLimiter(
    RATE_LIMITS.EMAIL_PER_HOUR,
    60 * 60 * 1000
  ),
  smsPerDay: new RateLimiter(
    RATE_LIMITS.SMS_PER_DAY,
    24 * 60 * 60 * 1000
  ),
  whatsappPerDay: new RateLimiter(
    RATE_LIMITS.WHATSAPP_PER_DAY,
    24 * 60 * 60 * 1000
  ),
};

// ========================================
// MIDDLEWARE DE RATE LIMITING
// ========================================
export function checkRateLimit(
  userId: string,
  channel?: 'email' | 'sms' | 'whatsapp'
): { allowed: boolean; reason?: string; retryAfter?: Date } {
  // Check global rate limits
  const perMinute = rateLimiters.perMinute.check(userId);
  if (!perMinute.allowed) {
    return {
      allowed: false,
      reason: `Limite de ${RATE_LIMITS.NOTIFICATIONS_PER_MINUTE}/minuto excedido`,
      retryAfter: perMinute.resetAt,
    };
  }

  const perHour = rateLimiters.perHour.check(userId);
  if (!perHour.allowed) {
    return {
      allowed: false,
      reason: `Limite de ${RATE_LIMITS.NOTIFICATIONS_PER_HOUR}/hora excedido`,
      retryAfter: perHour.resetAt,
    };
  }

  const perDay = rateLimiters.perDay.check(userId);
  if (!perDay.allowed) {
    return {
      allowed: false,
      reason: `Limite de ${RATE_LIMITS.NOTIFICATIONS_PER_DAY}/dia excedido`,
      retryAfter: perDay.resetAt,
    };
  }

  // Check channel-specific limits
  if (channel === 'email') {
    const emailLimit = rateLimiters.emailPerHour.check(`${userId}:email`);
    if (!emailLimit.allowed) {
      return {
        allowed: false,
        reason: `Limite de ${RATE_LIMITS.EMAIL_PER_HOUR} emails/hora excedido`,
        retryAfter: emailLimit.resetAt,
      };
    }
  }

  if (channel === 'sms') {
    const smsLimit = rateLimiters.smsPerDay.check(`${userId}:sms`);
    if (!smsLimit.allowed) {
      return {
        allowed: false,
        reason: `Limite de ${RATE_LIMITS.SMS_PER_DAY} SMS/dia excedido`,
        retryAfter: smsLimit.resetAt,
      };
    }
  }

  if (channel === 'whatsapp') {
    const whatsappLimit = rateLimiters.whatsappPerDay.check(`${userId}:whatsapp`);
    if (!whatsappLimit.allowed) {
      return {
        allowed: false,
        reason: `Limite de ${RATE_LIMITS.WHATSAPP_PER_DAY} WhatsApp/dia excedido`,
        retryAfter: whatsappLimit.resetAt,
      };
    }
  }

  return { allowed: true };
}

// ========================================
// QUEUE COM BACKPRESSURE
// ========================================
export class NotificationQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private concurrency: number;
  private activeJobs = 0;
  private maxQueueSize: number;

  constructor(concurrency: number = 5, maxQueueSize: number = 1000) {
    this.concurrency = concurrency;
    this.maxQueueSize = maxQueueSize;
  }

  async add(job: () => Promise<void>): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Queue is full - backpressure applied');
    }

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await job();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.activeJobs > 0) {
      while (this.activeJobs < this.concurrency && this.queue.length > 0) {
        const job = this.queue.shift();
        if (job) {
          this.activeJobs++;
          job()
            .finally(() => {
              this.activeJobs--;
            });
        }
      }

      // Aguardar um pouco antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.processing = false;
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      activeJobs: this.activeJobs,
      concurrency: this.concurrency,
      utilization: this.activeJobs / this.concurrency,
    };
  }

  clear() {
    this.queue = [];
  }
}

// ========================================
// DEBOUNCE E THROTTLE
// ========================================
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, waitMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

// ========================================
// CIRCUIT BREAKER
// ========================================
export class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1min
    private resetTimeout: number = 30000 // 30s
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        ),
      ]);

      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure,
    };
  }
}

// ========================================
// RETRY COM BACKOFF EXPONENCIAL
// ========================================
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.3 * delay; // ±30% jitter
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw lastError!;
}

// ========================================
// EXPORTAÇÃO
// ========================================
export default {
  checkRateLimit,
  RateLimiter,
  NotificationQueue,
  CircuitBreaker,
  debounce,
  throttle,
  retryWithBackoff,
};
