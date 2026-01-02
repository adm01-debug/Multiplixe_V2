# 🔄 MIGRAÇÃO MOCK → PRODUÇÃO
## Sistema de Notificações - 16 Sistemas

---

## 📸 SNAPSHOT DO SISTEMA ATUAL

**Nome:** Sistema Unificado de Notificações  
**Propósito:** Hub centralizado de comunicação omnichannel  
**Ambiente Atual:** Desenvolvimento (código pronto, aguardando produção)  
**Sistemas Cobertos:** 16 aplicações empresariais  
**Canais:** In-App, Email, Push, SMS, WhatsApp

---

## 🟡 MOCKS IDENTIFICADOS

| # | Componente | Mock Atual | Produção Real | Impacto |
|---|------------|------------|---------------|---------|
| 1 | Push Notifications | `console.log('Push:')` | Web Push API + Service Worker | Push não funciona |
| 2 | SMS Twilio | Credenciais fake | Twilio real com account_sid | SMS não é enviado |
| 3 | WhatsApp Twilio | Telefone mock | WhatsApp Business validado | WhatsApp não funciona |
| 4 | Email Resend | API key vazia | Resend key válida | Email não enviado |
| 5 | User IDs | Hardcoded UUIDs | Auth real do Supabase | Notif pro usuário errado |
| 6 | Webhooks OUT | Endpoints fake | URLs reais dos sistemas | Webhooks não disparam |
| 7 | Realtime Channels | Canal genérico | Canais por user_id | Todos veem tudo |
| 8 | Digest scheduling | Não implementado | Cron job real | Digest não envia |

---

## ✅ FONTES DE DADOS REAIS

### 1. PUSH NOTIFICATIONS

**MOCK:**
```typescript
async function sendPush(n: any) {
  console.log('Push enviado:', n.id);
}
```

**PRODUÇÃO:**
```typescript
// 1. Registrar Service Worker
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.action_url }
  });
});

// 2. Solicitar permissão e salvar subscription
import { supabase } from '@/integrations/supabase/client';

export async function registerPushNotifications() {
  if (!('Notification' in window)) return null;
  
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  });

  // Salvar subscription no banco
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('push_subscriptions').upsert({
    user_id: user?.id,
    subscription: JSON.stringify(subscription),
    created_at: new Date().toISOString()
  });

  return subscription;
}

// 3. Edge Function atualizada
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your@email.com',
  Deno.env.get('VAPID_PUBLIC_KEY') || '',
  Deno.env.get('VAPID_PRIVATE_KEY') || ''
);

async function sendPush(notification: any) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', notification.user_id);

  for (const sub of subscriptions || []) {
    await webpush.sendNotification(
      JSON.parse(sub.subscription),
      JSON.stringify({
        title: notification.title,
        message: notification.message,
        action_url: notification.action_url
      })
    );
  }
}
```

**CHECKLIST:**
- [ ] Gerar VAPID keys: `npx web-push generate-vapid-keys`
- [ ] Criar tabela `push_subscriptions`
- [ ] Criar Service Worker `/public/sw.js`
- [ ] Solicitar permissão no login
- [ ] Testar notificação push real
- [ ] Configurar VAPID no Supabase secrets

---

### 2. SMS VIA TWILIO

**MOCK:**
```typescript
const TWILIO_ACCOUNT_SID = "ACxxx_fake";
```

**PRODUÇÃO:**
```bash
# Obter credenciais reais
1. Criar conta Twilio: https://www.twilio.com/try-twilio
2. Verificar número de telefone
3. Comprar número Twilio (+55 brasileiro recomendado)
4. Copiar Account SID e Auth Token

# Configurar
npx supabase secrets set TWILIO_ACCOUNT_SID=AC...real
npx supabase secrets set TWILIO_AUTH_TOKEN=...real
npx supabase secrets set TWILIO_PHONE_NUMBER=+5511999999999
```

**VALIDAÇÃO:**
```typescript
// Testar SMS real
const response = await fetch('https://xxx.supabase.co/functions/v1/send-notification', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user-uuid-real',
    title: 'Teste SMS',
    message: 'Este é um SMS real de teste',
    source_system: 'test',
    channels: ['sms'],
    priority: 3
  })
});

// Verificar se SMS chegou no celular
```

**CHECKLIST:**
- [ ] Criar conta Twilio (trial ou paga)
- [ ] Verificar número de destino
- [ ] Comprar número remetente
- [ ] Configurar secrets no Supabase
- [ ] Testar envio real
- [ ] Configurar alertas de crédito baixo
- [ ] Monitorar custos por SMS

---

### 3. WHATSAPP VIA TWILIO

**MOCK:**
```typescript
const TWILIO_WHATSAPP = "whatsapp:+14155238886"; // Sandbox
```

**PRODUÇÃO:**
```bash
# Opção 1: WhatsApp Sandbox (TESTES)
1. Acessar Twilio Console > Messaging > Try it out > Try WhatsApp
2. Enviar mensagem de ativação do sandbox
3. Usar número sandbox para testes

# Opção 2: WhatsApp Business API (PRODUÇÃO)
1. Solicitar acesso WhatsApp Business API
2. Enviar documentos da empresa
3. Aguardar aprovação (5-7 dias)
4. Configurar templates de mensagem pré-aprovados
5. Usar número real da empresa

# Configurar
npx supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+5511999999999
```

**IMPORTANTE:**
- WhatsApp tem regras RÍGIDAS: só mensagens template ou dentro de 24h da última msg do cliente
- Criar templates no Twilio e aguardar aprovação
- Usar ZAPP como gateway preferencial

**CHECKLIST:**
- [ ] Ativar WhatsApp sandbox para testes
- [ ] Criar templates de mensagem
- [ ] Solicitar aprovação WhatsApp Business
- [ ] Integrar com ZAPP (sistema 10)
- [ ] Testar opt-in/opt-out
- [ ] Monitorar taxa de entrega
- [ ] Documentar templates aprovados

---

### 4. EMAIL VIA RESEND

**MOCK:**
```typescript
const RESEND_API_KEY = "re_fake";
```

**PRODUÇÃO:**
```bash
# Obter API key real
1. Criar conta: https://resend.com
2. Verificar domínio (DNS records)
3. Gerar API key

# Verificar domínio
# Adicionar records no seu DNS:
resend._domainkey.yourdomain.com CNAME xxx.resend.com
yourdomain.com TXT "v=spf1 include:amazonses.com ~all"
_dmarc.yourdomain.com TXT "v=DMARC1; p=none;"

# Configurar
npx supabase secrets set RESEND_API_KEY=re_...real
```

**VALIDAÇÃO:**
```typescript
// Testar email real
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${REAL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'Notificações <noreply@seudomain.com.br>',
    to: 'seu@email.com',
    subject: 'Teste Produção',
    html: '<h1>Email real funcionando!</h1>'
  })
});
```

**CHECKLIST:**
- [ ] Criar conta Resend
- [ ] Verificar domínio (DNS)
- [ ] Aguardar propagação DNS (24-48h)
- [ ] Gerar API key produção
- [ ] Configurar secret
- [ ] Testar deliverability
- [ ] Configurar SPF/DKIM/DMARC
- [ ] Monitorar bounce rate

---

### 5. USER IDS REAIS

**MOCK:**
```typescript
const userId = "00000000-0000-0000-0000-000000000000";
```

**PRODUÇÃO:**
```typescript
// Sempre pegar do contexto de autenticação
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  throw new Error('User not authenticated');
}

await sendNotification({
  userId: user.id, // UUID real do Supabase Auth
  // ...
});
```

**CHECKLIST:**
- [ ] Garantir auth em todas as rotas
- [ ] Validar user_id antes de enviar notificação
- [ ] Implementar middleware de autenticação
- [ ] Testar com múltiplos usuários reais
- [ ] Verificar RLS policies

---

### 6. WEBHOOKS OUT - URLs REAIS

**MOCK:**
```typescript
const webhook_url = "http://localhost:3000/webhook";
```

**PRODUÇÃO:**
```typescript
// Obter URLs reais dos sistemas
const WEBHOOKS_PRODUÇÃO = {
  compras: "https://compras.promobrindes.com.br/api/webhooks/notifications",
  wms: "https://wms.promobrindes.com.br/api/webhooks/notifications",
  finance: "https://finance.promobrindes.com.br/api/webhooks/notifications",
  salespro: "https://crm.promobrindes.com.br/api/webhooks/notifications",
  // ... outros sistemas
};

// Salvar no banco
await supabase.from('webhook_configs').insert({
  system: 'compras',
  url: WEBHOOKS_PRODUÇÃO.compras,
  secret: crypto.randomUUID(), // Para HMAC
  events: ['notification.created', 'notification.read'],
  is_active: true
});
```

**CHECKLIST:**
- [ ] Levantar URLs webhook de cada sistema
- [ ] Configurar secrets HMAC
- [ ] Testar chamada webhook real
- [ ] Implementar retry logic
- [ ] Monitorar webhook logs
- [ ] Documentar payload esperado

---

### 7. REALTIME CHANNELS POR USUÁRIO

**MOCK:**
```typescript
.channel('notifications-realtime') // Todo mundo no mesmo canal
```

**PRODUÇÃO:**
```typescript
// Canal privado por usuário
const { data: { user } } = await supabase.auth.getUser();

const channel = supabase
  .channel(`notifications:${user.id}`) // Canal único
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}` // Filtro crítico
    },
    handleNotification
  )
  .subscribe();
```

**CHECKLIST:**
- [ ] Criar canais por user_id
- [ ] Testar isolamento entre usuários
- [ ] Validar RLS no realtime
- [ ] Limpar subscriptions ao deslogar

---

### 8. DIGEST SCHEDULING - CRON JOB

**MOCK:**
Não implementado

**PRODUÇÃO:**
```typescript
// Opção 1: Supabase Cron Jobs
// supabase/migrations/xxx_cron_digest.sql
SELECT cron.schedule(
  'send-daily-digest',
  '0 9 * * *', -- Todos os dias às 9h
  $$
  SELECT net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/send-digest',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);

// Opção 2: GitHub Actions
// .github/workflows/digest-cron.yml
name: Send Daily Digest
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Digest
        run: |
          curl -X POST https://xxx.supabase.co/functions/v1/send-digest \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

**CHECKLIST:**
- [ ] Escolher método de scheduling
- [ ] Configurar cron job
- [ ] Testar execução manual
- [ ] Validar horários (timezone)
- [ ] Monitorar execuções
- [ ] Alertar se falhar

---

## 🔐 CHECKLIST SEGURANÇA PRÉ-PRODUÇÃO

### Secrets e Credenciais:
- [ ] Todas as API keys em Supabase secrets
- [ ] Nenhuma credencial no código
- [ ] `.env.example` documentado
- [ ] Secrets diferentes em dev/staging/prod

### Autenticação:
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies testadas com múltiplos usuários
- [ ] Tokens JWT com expiração
- [ ] Refresh tokens implementados

### Autorização:
- [ ] Usuário só vê suas próprias notificações
- [ ] Preferências isoladas por usuário
- [ ] Webhooks validam origem

### Sanitização:
- [ ] Inputs validados (title, message)
- [ ] SQL injection prevenido
- [ ] XSS prevenido em emails/push

### Rate Limiting:
- [ ] Edge functions com rate limit
- [ ] Webhook retries com backoff
- [ ] SMS com limite de crédito

### Monitoramento:
- [ ] Logs estruturados
- [ ] Alertas de erro configurados
- [ ] Métricas de deliverability

---

## 🧪 PLANO DE TESTES PRODUÇÃO

### 1. Testes Unitários (Jest/Vitest)
```typescript
describe('sendNotification', () => {
  it('deve enviar in-app com sucesso', async () => {
    const result = await sendNotification({
      userId: TEST_USER_ID,
      title: 'Test',
      message: 'Test',
      sourceSystem: 'test',
      channels: ['in_app']
    });
    expect(result.success).toBe(true);
  });

  it('deve falhar sem user_id', async () => {
    await expect(sendNotification({...})).rejects.toThrow();
  });
});
```

### 2. Testes de Integração
```bash
# Testar edge function real
curl -X POST https://xxx.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{
    "user_id": "real-uuid",
    "title": "Teste Integração",
    "message": "Testando produção",
    "source_system": "test",
    "channels": ["in_app", "email"]
  }'

# Verificar no banco
SELECT * FROM notifications WHERE user_id = 'real-uuid' ORDER BY created_at DESC LIMIT 1;

# Verificar email chegou
# Verificar in-app apareceu em tempo real
```

### 3. Testes de Carga (Artillery/k6)
```yaml
# artillery-test.yml
config:
  target: 'https://xxx.supabase.co'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Enviar notificações"
    flow:
      - post:
          url: "/functions/v1/send-notification"
          headers:
            Authorization: "Bearer {{token}}"
          json:
            user_id: "{{userId}}"
            title: "Load Test"
            message: "Testing {{$randomNumber()}}"
            source_system: "test"
            channels: ["in_app"]
```

---

## 🚀 ORDEM DE MIGRAÇÃO (3 SEMANAS)

### SEMANA 1 - INFRAESTRUTURA
**Dias 1-2:** Secrets e Credenciais
- [ ] Criar contas: Twilio, Resend
- [ ] Configurar todos os secrets
- [ ] Testar conexões básicas

**Dias 3-4:** Email e SMS
- [ ] Verificar domínio DNS
- [ ] Testar envio email real
- [ ] Testar SMS real
- [ ] Configurar templates

**Dia 5:** Push Notifications
- [ ] Gerar VAPID keys
- [ ] Criar Service Worker
- [ ] Testar push real

---

### SEMANA 2 - INTEGRAÇÕES
**Dias 1-2:** Sistemas Prioritários (6)
- [ ] Finance Hub - Push crítico
- [ ] Compras - Push + SMS
- [ ] SalesPro - WhatsApp
- [ ] WMS - Alertas estoque
- [ ] Lalamove - GPS tracking
- [ ] ZAPP - Gateway WhatsApp

**Dias 3-4:** Sistemas Importantes (5)
- [ ] HELLO - Atendimento
- [ ] Match ATS - Recrutamento
- [ ] DP - RH
- [ ] Loggi-Flow - Entregas
- [ ] Bitrix24 - Integração

**Dia 5:** Validação
- [ ] Testes end-to-end
- [ ] Correção de bugs
- [ ] Ajustes de performance

---

### SEMANA 3 - FINALIZAÇÃO
**Dias 1-2:** Sistemas Complementares (5)
- [ ] MULTIPLIXE, TaskGifts, Fast Grava, FUXICO, Gifts

**Dias 3-4:** Testes de Carga
- [ ] Simular 10k notif/min
- [ ] Testar todos os canais
- [ ] Validar rate limits

**Dia 5:** Go-Live
- [ ] Deploy produção
- [ ] Monitoramento ativo
- [ ] Suporte on-call

---

## 📊 CRITÉRIOS DE ACEITE PRODUÇÃO

Sistema só vai para produção quando:

### Técnico:
- [ ] ✅ 100% dos mocks substituídos
- [ ] ✅ Todas credenciais reais configuradas
- [ ] ✅ Testes automatizados passando
- [ ] ✅ Performance <500ms por notificação
- [ ] ✅ Taxa de entrega >99%
- [ ] ✅ Nenhum erro crítico em 24h de staging

### Funcional:
- [ ] ✅ In-app funcionando em tempo real
- [ ] ✅ Email entregue e não caindo em spam
- [ ] ✅ Push chegando em mobile/desktop
- [ ] ✅ SMS entregue no prazo
- [ ] ✅ WhatsApp com opt-in validado

### Segurança:
- [ ] ✅ RLS testado com 10+ usuários
- [ ] ✅ Nenhuma credencial exposta
- [ ] ✅ Rate limiting funcionando
- [ ] ✅ HTTPS em todas as conexões

### Operacional:
- [ ] ✅ Logs estruturados e centralizados
- [ ] ✅ Alertas configurados (Slack/PagerDuty)
- [ ] ✅ Backup testado
- [ ] ✅ Rollback documentado e testado
- [ ] ✅ Documentação atualizada
- [ ] ✅ Runbook de incidentes criado

---

## 🚨 PLANO DE ROLLBACK

Se algo der errado em produção:

### Nível 1 - Rollback Rápido (< 5min)
```bash
# Reverter deploy
git revert HEAD
git push origin main

# Ou desabilitar feature flag
UPDATE feature_flags SET enabled = false WHERE name = 'notifications_v2';
```

### Nível 2 - Rollback Parcial (< 15min)
```bash
# Desabilitar apenas canais problemáticos
UPDATE notification_preferences 
SET email_enabled = false 
WHERE user_id IN (SELECT user_id FROM affected_users);
```

### Nível 3 - Rollback Completo (< 30min)
```bash
# Restaurar versão anterior do banco
pg_restore -d production notifications_backup_20260102.dump

# Redirecionar tráfego para versão antiga
# (via load balancer ou DNS)
```

---

**🎯 SISTEMA PRONTO PARA MIGRAÇÃO PRODUÇÃO!**

Siga este guia passo a passo para garantir migração segura e sem surpresas! 🚀
