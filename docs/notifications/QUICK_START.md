# ⚡ GUIA RÁPIDO - 15 MINUTOS
## Implementação Express de Notificações

---

## 🎯 OBJETIVO

Implementar sistema de notificações em qualquer um dos 16 sistemas em **15 minutos**.

---

## ✅ CHECKLIST EXPRESS

### 1️⃣ BANCO (2 min)

```bash
# Aplicar migrations
npx supabase migration new notifications
# Colar conteúdo de sql/01_notifications_tables.sql
npx supabase db push
```

### 2️⃣ EDGE FUNCTION (3 min)

```bash
# Copiar função
cp functions/send-notification.ts supabase/functions/

# Deploy
npx supabase functions deploy send-notification --no-verify-jwt

# Configurar secrets
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set TWILIO_ACCOUNT_SID=ACxxx
npx supabase secrets set TWILIO_AUTH_TOKEN=xxx
```

### 3️⃣ HOOKS (2 min)

```bash
# Copiar hooks
cp hooks/useNotifications.ts src/hooks/
cp hooks/useNotificationPreferences.ts src/hooks/
```

### 4️⃣ COMPONENTES (3 min)

```bash
# Copiar componentes
cp components/NotificationCenter.tsx src/components/
cp components/NotificationPreferences.tsx src/components/
```

### 5️⃣ LIB (1 min)

```bash
# Copiar helpers
cp lib/notifications.ts src/lib/
```

### 6️⃣ INTEGRAÇÃO (2 min)

```tsx
// src/components/Header.tsx
import { NotificationCenter } from '@/components/NotificationCenter';

export function Header() {
  return (
    <header>
      {/* ... */}
      <NotificationCenter />
    </header>
  );
}
```

### 7️⃣ TESTE (2 min)

```typescript
// Em qualquer página
import { sendNotification } from '@/lib/notifications';

// Testar
await sendNotification({
  userId: user.id,
  title: 'Teste',
  message: 'Sistema funcionando!',
  type: 'success',
  category: 'system',
  sourceSystem: 'test',
  channels: ['in_app', 'email'],
  priority: 1,
});
```

---

## 🎉 PRONTO!

✅ In-App funcionando
✅ Email configurado
✅ Central de notificações no header
✅ Realtime ativo

**Tempo total: ~15 minutos**

---

## 🚀 PRÓXIMOS PASSOS

1. Adicionar casos de uso específicos (aprovações, alertas)
2. Configurar SMS (se necessário)
3. Configurar WhatsApp (se necessário)
4. Personalizar templates
5. Configurar preferências

---

## 📱 ADICIONAR PUSH (OPCIONAL +5min)

```typescript
// src/lib/push.ts
export async function requestPushPermission() {
  if (!('Notification' in window)) return;
  
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    // Registrar service worker
    // Salvar subscription no banco
  }
}

// Chamar no login
requestPushPermission();
```

---

## 📲 ADICIONAR SMS (OPCIONAL +3min)

Já configurado! Apenas use:

```typescript
await sendNotification({
  // ...
  channels: ['in_app', 'sms'], // Adicionar SMS
  // ...
});
```

---

## 💬 ADICIONAR WHATSAPP (OPCIONAL +3min)

Já configurado! Apenas use:

```typescript
await sendNotification({
  // ...
  channels: ['in_app', 'whatsapp'], // Adicionar WhatsApp
  // ...
});
```

---

## 🐛 TROUBLESHOOTING

### Notificações não aparecem?
```typescript
// Verificar RLS
// Verificar user_id correto
// Verificar realtime subscription
```

### Email não chega?
```bash
# Verificar Resend API key
npx supabase secrets list
```

### Realtime não funciona?
```typescript
// Verificar subscription
const channel = supabase.channel('notifications-realtime');
console.log(channel.state); // deve ser 'joined'
```

---

## ✨ DICA PRO

Use os helpers pré-definidos:

```typescript
import { NotificationHelpers } from '@/lib/notifications';

// Aprovação
await NotificationHelpers.approval(userId, 'Pedido #123', '/pedidos/123');

// Alerta
await NotificationHelpers.alert(userId, 'Estoque Baixo', 'Produto X: 5 unidades');

// Lembrete
await NotificationHelpers.reminder(userId, 'Reunião em 30 minutos');
```

---

**Tudo pronto em 15 minutos! 🎉**
