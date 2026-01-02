# 🔔 SISTEMA UNIFICADO DE NOTIFICAÇÕES
## Hub Centralizado de Comunicação Omnichannel - 16 Sistemas

---

## 📊 VISÃO GERAL

Sistema completo de notificações em tempo real que integra **15 funcionalidades** em **16 sistemas empresariais** através de **5 canais** de comunicação.

### Canais Suportados:
- 📱 **In-App** (Realtime via Supabase)
- 📧 **Email** (via Resend)
- 🔔 **Push Notifications** (Web Push API)
- 📱 **SMS** (via Twilio)
- 💬 **WhatsApp** (via Twilio/ZAPP Gateway)

### 16 Sistemas Integrados:
1. Compras | 2. ESTOKI WMS | 3. DP System | 4. TaskGifts
5. FUXICO | 6. HELLO | 7. MULTIPLIXE | 8. SalesPro
9. Loggi-Flow | 10. ZAPP | 11. Fast Grava | 12. Match ATS
13. Lalamove | 14. Finance Hub | 15. Gifts Store | 16. Bitrix24

---

## 🚀 QUICK START

### 1. Aplicar Migrations

```bash
# Copiar migrations para projeto
cp sql/*.sql ../ascend-learning-platform/supabase/migrations/

# Aplicar
cd ../ascend-learning-platform
npx supabase db push
```

### 2. Deploy Edge Function

```bash
# Copiar função
cp functions/send-notification.ts ../ascend-learning-platform/supabase/functions/

# Deploy
cd ../ascend-learning-platform
npx supabase functions deploy send-notification --no-verify-jwt
```

### 3. Configurar Secrets

```bash
npx supabase secrets set TWILIO_ACCOUNT_SID=ACxxx
npx supabase secrets set TWILIO_AUTH_TOKEN=xxx
npx supabase secrets set TWILIO_PHONE_NUMBER=+1xxx
npx supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+1xxx
npx supabase secrets set RESEND_API_KEY=re_xxx
```

### 4. Instalar Hooks e Componentes

```bash
# Copiar arquivos
cp hooks/*.ts ../[sistema]/src/hooks/
cp components/*.tsx ../[sistema]/src/components/
cp lib/*.ts ../[sistema]/src/lib/
```

### 5. Adicionar ao Header

```tsx
import { NotificationCenter } from '@/components/NotificationCenter';

// No seu Header/Navbar
<NotificationCenter />
```

---

## 📁 ESTRUTURA DO PACOTE

```
notification-system/
├── sql/
│   ├── 01_notifications_tables.sql
│   └── 02_templates_webhooks_functions.sql
├── functions/
│   └── send-notification.ts
├── hooks/
│   ├── useNotifications.ts
│   └── useNotificationPreferences.ts
├── components/
│   ├── NotificationCenter.tsx
│   └── NotificationPreferences.tsx
├── lib/
│   └── notifications.ts
└── guides/
    ├── sistemas_01-04.md
    ├── sistemas_05-08.md
    ├── sistemas_09-12.md
    └── sistemas_13-16_FINAL.md
```

---

## 🎯 FEATURES IMPLEMENTADAS

### Core (Todos os Sistemas):
✅ In-App Notifications (Realtime)
✅ Central de Notificações
✅ Contador de não lidas
✅ Marcar como lida
✅ Ações rápidas
✅ Agrupamento inteligente

### Avançadas:
✅ Email Notifications
✅ Push Notifications (9 sistemas precisam)
✅ SMS (10 sistemas precisam)
✅ WhatsApp (7 sistemas precisam)
✅ Do Not Disturb
✅ Digest Diário
✅ Templates personalizáveis
✅ Webhooks IN/OUT
✅ Preferências por usuário
✅ Priorização automática

---

## 🔴 SISTEMAS PRIORITÁRIOS

### Fase 1 - CRÍTICOS (Semana 1):
1. **Finance Hub** ⚠️ - Push + SMS (aprovações urgentes)
2. **Compras** - Push + SMS
3. **SalesPro** - Push + WhatsApp
4. **Lalamove** - WhatsApp
5. **ESTOKI WMS** - Push

### Fase 2 - IMPORTANTES (Semana 2):
6. HELLO - WhatsApp
7. ZAPP - Gateway principal
8. Match ATS - WhatsApp
9. DP System - SMS
10. Loggi-Flow - SMS

### Fase 3 - COMPLEMENTARES (Semana 3):
11-16. Demais sistemas

---

## 📝 EXEMPLO DE USO

```typescript
import { sendNotification } from '@/lib/notifications';

// Aprovação urgente
await sendNotification({
  userId: aprovadorId,
  title: 'Aprovação Urgente',
  message: 'Pedido #123 aguarda aprovação - R$ 15.000',
  type: 'urgent',
  category: 'approval',
  sourceSystem: 'compras',
  channels: ['in_app', 'email', 'push', 'sms'],
  priority: 3,
  actionUrl: '/pedidos/123',
  actionLabel: 'Aprovar/Rejeitar',
});

// Alerta simples
await sendNotification({
  userId: gestorId,
  title: 'Estoque Baixo',
  message: 'Produto X: 5 unidades restantes',
  type: 'warning',
  category: 'alert',
  sourceSystem: 'wms',
  channels: ['in_app', 'email'],
  priority: 2,
});
```

---

## 🧪 TESTES

```bash
# Testar envio
curl -X POST \
  https://xxx.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{
    "user_id": "uuid-aqui",
    "title": "Teste",
    "message": "Olá mundo!",
    "source_system": "test",
    "channels": ["in_app", "email"]
  }'
```

---

## 📊 MÉTRICAS DE SUCESSO

### Adoção:
- Taxa de abertura In-App: > 80%
- Taxa de abertura Email: > 30%
- Taxa de clique Push: > 10%

### Performance:
- Latência de envio: < 500ms
- Taxa de entrega: > 99%
- Disponibilidade: > 99.9%

### Negócio:
- Redução de SLA em 40%
- Aumento de engajamento em 60%
- Redução de tickets em 30%

---

## 🆘 SUPORTE

### Documentação:
- `/guides/` - Guias por sistema
- `/sql/` - Schemas e funções
- `/functions/` - Edge functions

### Troubleshooting:
1. Notificações não aparecem → Verificar RLS policies
2. Realtime não funciona → Verificar subscription
3. Email não chega → Verificar Resend API key
4. SMS não enviado → Verificar Twilio credentials

---

## 🔐 SEGURANÇA

- ✅ Row Level Security (RLS) habilitado
- ✅ Preferências por usuário
- ✅ Opt-out fácil
- ✅ LGPD compliant
- ✅ Webhooks com HMAC
- ✅ Rate limiting

---

## 📈 ROADMAP

- [ ] Push Notifications nativos (iOS/Android)
- [ ] Integração com Slack
- [ ] Integração com Microsoft Teams
- [ ] Analytics avançado
- [ ] A/B Testing de templates
- [ ] Machine Learning para timing otimizado

---

## 🎉 COMEÇE AGORA!

1. Escolha um sistema prioritário
2. Siga o guia em `/guides/`
3. Teste localmente
4. Deploy em produção
5. Monitore métricas

**Sistema pronto para produção!** 🚀
