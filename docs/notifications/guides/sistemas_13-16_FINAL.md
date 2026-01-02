# 🔔 GUIA IMPLEMENTAÇÃO - SISTEMAS 13-16 (FINAL)

## 1️⃣3️⃣ LALAMOVE GUARDIAN 💎

### Features: Push ❌ | SMS 🟡 | WhatsApp ✅💎

**Prioridade:** 🔴 P1

### Implementação:

```typescript
// src/pages/EntregasPage.tsx

// Motorista a caminho
await sendNotification({
  userId: clienteId,
  title: '🚗 Motorista a Caminho',
  message: `${motorista.nome} chegará em ${tempo}. Placa: ${placa}`,
  type: 'info',
  category: 'system',
  sourceSystem: 'lalamove',
  channels: ['whatsapp', 'push'],
  priority: 1,
  actionUrl: `/rastreio/${entregaId}`,
});

// Entrega crítica atrasada
await sendNotification({
  userId: supervisorId,
  title: '🚨 ENTREGA CRÍTICA ATRASADA',
  message: `${cliente.nome} - Atraso: ${minutos}min - ${local}`,
  type: 'error',
  category: 'alert',
  sourceSystem: 'lalamove',
  channels: ['in_app', 'push', 'sms'],
  priority: 3,
});
```

---

## 1️⃣4️⃣ FINANCE HUB ⚠️💎

### Features: Push ❌🔴 | SMS 🟡 | WhatsApp 🟡

**Prioridade:** 🔴🔴🔴 P1 CRÍTICO

### Implementação URGENTE:

```typescript
// src/pages/LancamentosPage.tsx

// APROVAÇÃO URGENTE
await sendNotification({
  userId: aprovadorId,
  title: '🚨 APROVAÇÃO URGENTE - FINANCEIRO',
  message: `Lançamento #${lancamentoId} - R$ ${valor} - ${fornecedor}`,
  type: 'urgent',
  category: 'approval',
  sourceSystem: 'finance',
  sourceEntityType: 'lancamento',
  sourceEntityId: lancamentoId,
  channels: ['in_app', 'email', 'push', 'sms'], // SMS OBRIGATÓRIO
  priority: 3,
  actionUrl: `/finance/lancamentos/${lancamentoId}`,
  actionLabel: 'Aprovar/Rejeitar',
});

// Vencimento próximo (48h)
await sendNotification({
  userId: gestorId,
  title: '⏰ Vencimento Próximo',
  message: `${total} contas vencem em 48h - Total: R$ ${valor}`,
  type: 'warning',
  category: 'alert',
  sourceSystem: 'finance',
  channels: ['in_app', 'email', 'push'],
  priority: 2,
});

// Conta vencida
await sendNotification({
  userId: gestorId,
  title: '🔴 CONTA VENCIDA',
  message: `${fornecedor} - R$ ${valor} - Vencimento: ${data}`,
  type: 'error',
  category: 'alert',
  sourceSystem: 'finance',
  channels: ['in_app', 'email', 'sms'],
  priority: 3,
});

// Limite de crédito
await sendNotification({
  userId: diretorId,
  title: '💳 Limite de Crédito 90%',
  message: `Banco ${banco} - Usado: R$ ${usado} / R$ ${limite}`,
  type: 'warning',
  category: 'alert',
  sourceSystem: 'finance',
  channels: ['in_app', 'email', 'sms'],
  priority: 2,
});

// Pagamento realizado
await sendNotification({
  userId: solicitanteId,
  title: '✅ Pagamento Realizado',
  message: `${fornecedor} - R$ ${valor} - ${banco}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'finance',
  channels: ['in_app', 'email'],
  priority: 1,
});
```

**CRÍTICO:** Finance Hub PRECISA de Push + SMS para aprovações urgentes!

---

## 1️⃣5️⃣ GIFTS STORE

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/PedidosPage.tsx

// Novo pedido
await sendNotification({
  userId: gestorId,
  title: '🎁 Novo Pedido',
  message: `${cliente.nome} - R$ ${valor} - ${produtos.length} itens`,
  type: 'info',
  category: 'system',
  sourceSystem: 'gifts',
  channels: ['in_app', 'email'],
  priority: 1,
});

// Pedido enviado
await sendNotification({
  userId: clienteId,
  title: '📦 Pedido Enviado',
  message: `Seu pedido #${pedidoId} foi enviado! Rastreio: ${codigo}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'gifts',
  channels: ['whatsapp', 'email'],
  priority: 1,
  actionUrl: `/rastreio/${codigo}`,
});

// Pedido entregue
await sendNotification({
  userId: clienteId,
  title: '✅ Pedido Entregue',
  message: 'Avalie sua experiência conosco!',
  type: 'success',
  category: 'social',
  sourceSystem: 'gifts',
  channels: ['whatsapp', 'email'],
  priority: 0,
});
```

---

## 1️⃣6️⃣ BITRIX24 ACTION 💎

### Features: Push 🟡 | SMS 🟡 | WhatsApp ✅💎

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/ActionsPage.tsx

// Tarefa atribuída (do Bitrix)
await sendNotification({
  userId: responsavelId,
  title: '📋 Nova Tarefa - Bitrix24',
  message: `${tarefa.titulo} - Prazo: ${prazo}`,
  type: 'info',
  category: 'reminder',
  sourceSystem: 'bitrix24',
  channels: ['in_app', 'push', 'whatsapp'],
  priority: 1,
  actionUrl: `/bitrix24/tasks/${tarefaId}`,
});

// Webhook de entrada
await sendNotification({
  userId: responsavelId,
  title: 'Evento Bitrix24',
  message: `${evento.tipo}: ${evento.descricao}`,
  type: 'info',
  category: 'system',
  sourceSystem: 'bitrix24',
  channels: ['in_app'],
  priority: 0,
});

// Sincronização completa
await sendNotification({
  userId: adminId,
  title: '🔄 Sincronização Bitrix24',
  message: `${total} registros sincronizados com sucesso`,
  type: 'success',
  category: 'system',
  sourceSystem: 'bitrix24',
  channels: ['in_app', 'email'],
  priority: 0,
});
```

---

## 🎯 RESUMO FINAL DE IMPLEMENTAÇÃO

### Prioridade de Execução:

**🔴 FASE 1 - CRÍTICOS (Semana 1):**
1. Finance Hub - Push + SMS (URGENTE)
2. Compras - Push + SMS
3. SalesPro - Push + WhatsApp
4. Lalamove - WhatsApp
5. WMS - Push

**🟢 FASE 2 - IMPORTANTES (Semana 2):**
6. HELLO - WhatsApp gateway
7. ZAPP - Gateway principal
8. Match ATS - WhatsApp
9. DP System - SMS
10. Loggi-Flow - SMS

**🟡 FASE 3 - COMPLEMENTARES (Semana 3):**
11. MULTIPLIXE - Push
12. TaskGifts - Push
13. Fast Grava - Push
14. Gifts Store - WhatsApp
15. FUXICO - Push
16. Bitrix24 - WhatsApp

---

## 📊 CHECKLIST FINAL POR SISTEMA

```typescript
// Template de validação
const systemChecklist = {
  sql_applied: false,          // Migration aplicada
  edge_function_deployed: false, // Function no ar
  hooks_integrated: false,      // useNotifications instalado
  component_added: false,       // NotificationCenter no header
  test_notifications: false,    // Testes enviados
  realtime_working: false,      // Realtime subscrito
  push_configured: false,       // Push habilitado (se aplicável)
  sms_configured: false,        // SMS configurado (se aplicável)
  whatsapp_configured: false,   // WhatsApp configurado (se aplicável)
};
```

---

**✅ STATUS FINAL:** 16/16 sistemas documentados!
**🎉 IMPLEMENTAÇÃO COMPLETA PRONTA PARA EXECUÇÃO!**
