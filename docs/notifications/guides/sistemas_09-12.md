# 🔔 GUIA IMPLEMENTAÇÃO - SISTEMAS 9-12

## 9️⃣ LOGGI-FLOW

### Features: Push ❌ | SMS 🟡 | WhatsApp 🟡

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/EntregasPage.tsx

// Entrega atribuída
await sendNotification({
  userId: entregadorId,
  title: '📦 Nova Entrega',
  message: `${cliente.nome} - ${endereco} - ${distancia}km`,
  type: 'urgent',
  category: 'alert',
  sourceSystem: 'loggi',
  channels: ['in_app', 'push', 'sms'],
  priority: 3,
  actionUrl: `/entregas/${entregaId}`,
});

// Entrega em atraso
await sendNotification({
  userId: supervisorId,
  title: '⚠️ Entrega Atrasada',
  message: `Pedido #${pedidoId} - Atraso: ${minutos} min`,
  type: 'error',
  category: 'alert',
  sourceSystem: 'loggi',
  channels: ['in_app', 'sms'],
  priority: 3,
});

// Cliente notificação
await sendNotification({
  userId: clienteId,
  title: '🚚 Pedido Saiu para Entrega',
  message: `Previsão: ${previsao}. Rastreie em tempo real!`,
  type: 'info',
  category: 'system',
  sourceSystem: 'loggi',
  channels: ['whatsapp', 'sms'],
  priority: 1,
  actionUrl: `/rastreio/${codigoRastreio}`,
});
```

---

## 🔟 ZAPP (WhatsApp CRM) 💎

### Features: Push ✅ | SMS ✅ | WhatsApp ✅💎

**Prioridade:** 🔴 P1 (GATEWAY)

### Implementação:

```typescript
// src/pages/ConversasPage.tsx

// Nova mensagem
await sendNotification({
  userId: operadorId,
  title: '💬 Nova Mensagem WhatsApp',
  message: `${contato.nome}: ${preview}`,
  type: 'urgent',
  category: 'social',
  sourceSystem: 'zapp',
  channels: ['in_app', 'push'],
  priority: 3,
  actionUrl: `/conversas/${conversaId}`,
});

// Mensagem não respondida (30min)
await sendNotification({
  userId: supervisorId,
  title: '⚠️ Mensagem Não Respondida',
  message: `${contato.nome} aguarda há ${tempo}`,
  type: 'warning',
  category: 'alert',
  sourceSystem: 'zapp',
  channels: ['in_app', 'push', 'sms'],
  priority: 2,
});

// GATEWAY: Enviar WhatsApp via ZAPP
export async function sendZappWhatsApp(to: string, message: string) {
  // Usar ZAPP como gateway para outros sistemas
  await sendNotification({
    userId: 'system',
    title: message.split('\n')[0],
    message: message,
    type: 'info',
    category: 'system',
    sourceSystem: 'zapp',
    channels: ['whatsapp'],
    priority: 1,
  });
}
```

**IMPORTANTE:** ZAPP é gateway WhatsApp preferencial para outros sistemas!

---

## 1️⃣1️⃣ FAST GRAVA ES

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟡 P3

### Implementação:

```typescript
// src/pages/ProducaoPage.tsx

// Ordem de produção criada
await sendNotification({
  userId: operadorId,
  title: '🏭 Nova Ordem de Produção',
  message: `OP #${opId} - ${produto} - ${quantidade} unidades`,
  type: 'info',
  category: 'system',
  sourceSystem: 'fastgrava',
  channels: ['in_app', 'email'],
  priority: 1,
  actionUrl: `/producao/${opId}`,
});

// Máquina parada
await sendNotification({
  userId: tecnicoId,
  title: '🔧 Máquina Parada',
  message: `${maquina.nome} - ${motivo}`,
  type: 'error',
  category: 'alert',
  sourceSystem: 'fastgrava',
  channels: ['in_app', 'sms'],
  priority: 3,
});

// Produção concluída
await sendNotification({
  userId: supervisorId,
  title: '✅ Produção Concluída',
  message: `OP #${opId} - ${quantidade} unidades produzidas`,
  type: 'success',
  category: 'system',
  sourceSystem: 'fastgrava',
  channels: ['in_app'],
  priority: 0,
});
```

---

## 1️⃣2️⃣ MATCH ATS

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/VagasPage.tsx

// Nova candidatura
await sendNotification({
  userId: recrutadorId,
  title: '👤 Nova Candidatura',
  message: `${candidato.nome} se candidatou para ${vaga.titulo}`,
  type: 'info',
  category: 'social',
  sourceSystem: 'match',
  channels: ['in_app', 'email'],
  priority: 1,
  actionUrl: `/candidatos/${candidatoId}`,
});

// Entrevista agendada
await sendNotification({
  userId: candidatoId,
  title: '📅 Entrevista Agendada',
  message: `${vaga.titulo} - ${data} às ${hora}`,
  type: 'info',
  category: 'reminder',
  sourceSystem: 'match',
  channels: ['email', 'whatsapp', 'sms'],
  priority: 2,
  actionData: {
    google_calendar: true,
    reminder_24h: true,
  },
});

// Feedback pós-entrevista
await sendNotification({
  userId: recrutadorId,
  title: '⏰ Feedback Pendente',
  message: `Entrevista com ${candidato.nome} - Feedback aguardando`,
  type: 'warning',
  category: 'reminder',
  sourceSystem: 'match',
  channels: ['in_app', 'email'],
  priority: 1,
});

// Oferta aceita
await sendNotification({
  userId: gestorId,
  title: '🎉 Oferta Aceita!',
  message: `${candidato.nome} aceitou a oferta para ${vaga.titulo}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'match',
  channels: ['in_app', 'email'],
  priority: 1,
});
```

---

**STATUS:** ✅ 12/16 sistemas documentados
**PRÓXIMO:** Sistemas 13-16 (Lalamove, Finance Hub, Gifts Store, Bitrix24)
