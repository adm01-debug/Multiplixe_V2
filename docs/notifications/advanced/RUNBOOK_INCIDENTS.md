# 🚨 RUNBOOK DE INCIDENTES
## Sistema de Notificações - Guia de Troubleshooting

---

## 📞 CONTATOS DE EMERGÊNCIA

**On-Call:** [Seu número]  
**Slack:** #alerts-notifications  
**PagerDuty:** notifications-team  
**Status Page:** status.promobrindes.com.br

---

## 🔴 INCIDENTES COMUNS E SOLUÇÕES

### 1. NOTIFICAÇÕES NÃO CHEGAM

#### 🔍 Sintomas:
- Usuário reporta não receber notificações
- Badge contador não atualiza
- Central vazia

#### ✅ Diagnóstico:

```bash
# 1. Verificar se notificação foi criada
SELECT * FROM notifications 
WHERE user_id = 'USER_UUID' 
ORDER BY created_at DESC LIMIT 10;

# 2. Verificar RLS
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';

# 3. Verificar realtime subscription
# No browser console:
supabase.channel('notifications-realtime').state
// Deve retornar 'joined'

# 4. Verificar edge function
curl -X POST https://xxx.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer KEY" \
  -d '{"user_id":"UUID","title":"Test","message":"Test","source_system":"test"}'
```

#### 🔧 Soluções:

**Problema:** RLS bloqueando
```sql
-- Solução temporária (CUIDADO!)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Solução correta
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```

**Problema:** Realtime não conectado
```typescript
// Recriar subscription
const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {...})
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime conectado');
    }
  });
```

**Problema:** Edge function falhando
```bash
# Ver logs
npx supabase functions logs send-notification

# Redeploy
npx supabase functions deploy send-notification --no-verify-jwt
```

---

### 2. EMAILS NÃO ENVIADOS

#### 🔍 Sintomas:
- Email não chega na caixa de entrada
- Cai em spam
- Bounce rate alto

#### ✅ Diagnóstico:

```bash
# 1. Verificar delivery status
SELECT 
  title,
  delivery_status->>'email' as email_status,
  created_at
FROM notifications 
WHERE user_id = 'UUID'
  AND 'email' = ANY(channels)
ORDER BY created_at DESC;

# 2. Testar Resend diretamente
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -d '{
    "from": "test@yourdomain.com",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'

# 3. Verificar DNS
dig TXT yourdomain.com
dig TXT resend._domainkey.yourdomain.com
```

#### 🔧 Soluções:

**Problema:** API key inválida
```bash
# Verificar secret
npx supabase secrets list | grep RESEND

# Atualizar
npx supabase secrets set RESEND_API_KEY=re_new_key
```

**Problema:** DNS não propagado
```bash
# Aguardar 24-48h ou forçar com
# 1. Revalidar domínio no Resend
# 2. Verificar com: https://mxtoolbox.com/dmarc.aspx
```

**Problema:** Caindo em spam
```html
<!-- Adicionar unsubscribe link -->
<a href="{{unsubscribe_url}}">Cancelar inscrição</a>

<!-- Melhorar SPF/DKIM/DMARC -->
TXT @ "v=spf1 include:amazonses.com ~all"
TXT _dmarc "v=DMARC1; p=quarantine; pct=100"
```

---

### 3. SMS NÃO ENVIADO

#### 🔍 Sintomas:
- SMS não chega no celular
- Erro no delivery_status
- Custo alto inesperado

#### ✅ Diagnóstico:

```bash
# 1. Verificar créditos Twilio
curl -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Balance.json"

# 2. Verificar logs Twilio
# https://console.twilio.com/us1/monitor/logs/sms

# 3. Verificar formato do número
# Deve ser: +5511999999999 (E.164 format)
```

#### 🔧 Soluções:

**Problema:** Número inválido
```typescript
// Validar e formatar número
function formatPhoneNumber(phone: string): string {
  // Remove tudo exceto dígitos
  const digits = phone.replace(/\D/g, '');
  
  // Adiciona +55 se brasileiro
  if (digits.length === 11 && digits[0] !== '5') {
    return `+55${digits}`;
  }
  
  return `+${digits}`;
}
```

**Problema:** Sem crédito
```bash
# Adicionar crédito:
# https://console.twilio.com/us1/billing

# Ou configurar auto-reload
```

**Problema:** Número bloqueado
```bash
# Verificar opt-out list
# https://console.twilio.com/us1/monitor/insights/conversations

# Remover se necessário
```

---

### 4. PUSH NOTIFICATIONS NÃO FUNCIONA

#### 🔍 Sintomas:
- Push não aparece no browser/mobile
- Permissão negada
- Service Worker não registrado

#### ✅ Diagnóstico:

```javascript
// 1. Verificar permissão
console.log(Notification.permission); 
// Deve ser 'granted'

// 2. Verificar Service Worker
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW:', regs));

// 3. Verificar subscription
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription()
    .then(sub => console.log('Sub:', sub))
);

// 4. Testar push direto
const subscription = await reg.pushManager.getSubscription();
await fetch('/api/test-push', {
  method: 'POST',
  body: JSON.stringify(subscription)
});
```

#### 🔧 Soluções:

**Problema:** Service Worker não registrado
```javascript
// Registrar novamente
if ('serviceWorker' in navigator) {
  await navigator.serviceWorker.register('/sw.js');
}
```

**Problema:** VAPID keys inválidas
```bash
# Gerar novas
npx web-push generate-vapid-keys

# Configurar
npx supabase secrets set VAPID_PUBLIC_KEY=...
npx supabase secrets set VAPID_PRIVATE_KEY=...
```

**Problema:** Subscription expirada
```typescript
// Resubscrever
const reg = await navigator.serviceWorker.ready;
await reg.pushManager.getSubscription().then(s => s?.unsubscribe());
const newSub = await reg.pushManager.subscribe({...});

// Atualizar no banco
await supabase.from('push_subscriptions').upsert({
  user_id: userId,
  subscription: JSON.stringify(newSub)
});
```

---

### 5. WEBHOOKS NÃO DISPARAM

#### 🔍 Sintomas:
- Sistema externo não recebe notificação
- webhook_logs vazios
- Timeout errors

#### ✅ Diagnóstico:

```sql
-- 1. Verificar configuração
SELECT * FROM webhook_configs 
WHERE is_active = true;

-- 2. Verificar logs
SELECT * FROM webhook_logs 
WHERE success = false
ORDER BY created_at DESC
LIMIT 20;

-- 3. Testar URL manualmente
curl -X POST https://target-system.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{}}'
```

#### 🔧 Soluções:

**Problema:** URL inválida/offline
```sql
-- Desabilitar temporariamente
UPDATE webhook_configs 
SET is_active = false 
WHERE url = 'https://problematic-url.com';

-- Reativar quando voltar
UPDATE webhook_configs 
SET is_active = true 
WHERE url = 'https://problematic-url.com';
```

**Problema:** Timeout
```typescript
// Aumentar timeout na edge function
const response = await fetch(webhook.url, {
  signal: AbortSignal.timeout(10000) // 10s
});
```

**Problema:** Retry não funciona
```sql
-- Forçar retry manual
UPDATE webhook_logs 
SET attempt_number = 0 
WHERE id = 'LOG_ID';
```

---

### 6. REALTIME DELAY ALTO

#### 🔍 Sintomas:
- Notificações atrasam >5s
- Badge não atualiza em tempo real
- Múltiplas conexões abertas

#### ✅ Diagnóstico:

```javascript
// 1. Medir latência
const start = Date.now();
supabase.channel('test').on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications'
}, (payload) => {
  console.log('Latency:', Date.now() - start, 'ms');
});

// 2. Verificar número de subscriptions
const subs = await supabase.getSubscriptions();
console.log('Active subs:', subs.length);
// Deve ser ~1-3 por página
```

#### 🔧 Soluções:

**Problema:** Muitas subscriptions
```typescript
// Limpar ao desmontar
useEffect(() => {
  const channel = supabase.channel(...).subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Problema:** Filtro ineficiente
```typescript
// ❌ Ruim - sem filtro
.on('postgres_changes', {
  event: 'INSERT',
  table: 'notifications'
}, ...)

// ✅ Bom - com filtro
.on('postgres_changes', {
  event: 'INSERT',
  table: 'notifications',
  filter: `user_id=eq.${userId}` // Crítico!
}, ...)
```

---

### 7. DIGEST NÃO ENVIA

#### 🔍 Sintomas:
- Email diário não chega
- Cron job não executou
- Usuários reclamam

#### ✅ Diagnóstico:

```bash
# 1. Verificar cron job
SELECT * FROM cron.job 
WHERE jobname = 'send-daily-digest';

# 2. Ver logs de execução
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-digest')
ORDER BY start_time DESC;

# 3. Executar manualmente
SELECT cron.unschedule('send-daily-digest');
SELECT cron.schedule(
  'send-daily-digest',
  '0 9 * * *',
  $$SELECT net.http_post(...)$$
);
```

#### 🔧 Soluções:

**Problema:** Horário errado (timezone)
```sql
-- Ajustar para UTC-3 (Brasília)
SELECT cron.schedule(
  'send-daily-digest',
  '0 12 * * *', -- 9h Brasília = 12h UTC
  $$...$$
);
```

**Problema:** Edge function timeout
```typescript
// Processar em lotes
const users = await getUsersForDigest();
const batches = chunk(users, 10); // 10 por vez

for (const batch of batches) {
  await Promise.all(batch.map(sendDigest));
  await sleep(1000); // 1s entre lotes
}
```

---

## 🔥 CENÁRIOS DE EMERGÊNCIA

### TODOS OS CANAIS FALHANDO

**Checklist rápido:**
1. ✅ Supabase online? (status.supabase.com)
2. ✅ Edge functions deployadas?
3. ✅ Secrets configurados?
4. ✅ RLS não bloqueando tudo?
5. ✅ Banco de dados acessível?

**Solução emergencial:**
```typescript
// Fallback para logs locais
try {
  await sendNotification(...);
} catch (error) {
  // Log localmente
  console.error('[FALLBACK]', notification);
  
  // Salvar em localStorage temporariamente
  const failed = JSON.parse(localStorage.getItem('failed_notifs') || '[]');
  failed.push(notification);
  localStorage.setItem('failed_notifs', JSON.stringify(failed));
  
  // Retry em background
  setTimeout(() => retryFailedNotifications(), 60000);
}
```

---

### SPAM DE NOTIFICAÇÕES

**Sintomas:** Usuário recebe 100+ notificações idênticas

**Causa:** Loop infinito, agrupamento quebrado

**Solução imediata:**
```sql
-- Desabilitar agrupamento temporariamente
UPDATE notification_preferences 
SET grouping_enabled = false;

-- Deletar duplicadas
DELETE FROM notifications 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, title, message 
      ORDER BY created_at
    ) as rn
    FROM notifications
    WHERE created_at > NOW() - INTERVAL '1 hour'
  ) t
  WHERE rn > 1
);
```

---

### DATABASE DOWN

**Checklist:**
1. Verificar status Supabase
2. Verificar backups recentes
3. Ativar modo readonly
4. Comunicar downtime

**Fallback:**
```typescript
// Cache em memória (temporário)
const notificationCache = new Map();

function getCachedNotifications(userId: string) {
  if (!notificationCache.has(userId)) {
    // Tentar buscar do banco
    // Se falhar, retornar cache vazio
    notificationCache.set(userId, []);
  }
  return notificationCache.get(userId);
}
```

---

## 📊 MÉTRICAS PARA MONITORAR

### Critical (Alert PagerDuty):
- Taxa de erro edge functions >5%
- Latência realtime >1s
- Taxa de bounce email >10%
- SMS/WhatsApp falhas >20%

### Warning (Alert Slack):
- Notificações não entregues >1%
- Cron job digest falhou
- Webhook retry >3x
- Push subscription <50% usuários

### Info (Dashboard):
- Volume de notificações/hora
- Taxa de abertura por canal
- Tempo médio de entrega
- Custo SMS/WhatsApp diário

---

## 🛠️ FERRAMENTAS ÚTEIS

### Logs:
```bash
# Edge functions
npx supabase functions logs send-notification --tail

# Database
npx supabase db logs --tail

# Webhooks
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50;
```

### Debugging:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'notifications:*');

// Monitor realtime
supabase.channel('debug').on('*', console.log).subscribe();
```

---

## 📞 ESCALATION PATH

1. **Nível 1 (0-15min):** Dev on-call tenta resolver
2. **Nível 2 (15-30min):** Tech lead entra
3. **Nível 3 (30-60min):** CTO notificado
4. **Nível 4 (60min+):** Vendor support (Supabase/Twilio)

---

**🚨 MANTENHA ESTE RUNBOOK ATUALIZADO!**

Toda vez que resolver um incidente novo, adicione aqui para o próximo! 📝
