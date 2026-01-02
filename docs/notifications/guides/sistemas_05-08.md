# 🔔 GUIA IMPLEMENTAÇÃO - SISTEMAS 5-8

## 5️⃣ FUXICO

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟡 P3

### Implementação:

```typescript
// src/pages/FuxicoPage.tsx

// Nova conversa/fofoca
await sendNotification({
  userId: participanteId,
  title: '💬 Nova Mensagem',
  message: `${autor.nome}: ${preview}`,
  type: 'info',
  category: 'social',
  sourceSystem: 'fuxico',
  channels: ['in_app', 'push'],
  priority: 0,
});

// Menção em conversa
await sendNotification({
  userId: mencionadoId,
  title: '👋 Você foi Mencionado',
  message: `${autor.nome} mencionou você em ${topico}`,
  type: 'info',
  category: 'social',
  sourceSystem: 'fuxico',
  channels: ['in_app', 'push'],
  priority: 1,
});
```

---

## 6️⃣ HELLO CONTACT CENTER

### Features: Push 🟡 | SMS 🟡 | WhatsApp ✅💎

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/AtendimentoPage.tsx

// Novo atendimento
await sendNotification({
  userId: operadorId,
  title: '📞 Novo Atendimento',
  message: `Cliente: ${cliente.nome} - Canal: ${canal}`,
  type: 'urgent',
  category: 'alert',
  sourceSystem: 'hello',
  channels: ['in_app', 'push', 'whatsapp'],
  priority: 3,
  actionUrl: `/atendimento/${atendimentoId}`,
});

// SLA em risco
await sendNotification({
  userId: supervisorId,
  title: '⚠️ SLA em Risco',
  message: `Atendimento #${atendimentoId} - ${tempoRestante} restantes`,
  type: 'warning',
  category: 'alert',
  sourceSystem: 'hello',
  channels: ['in_app', 'push', 'sms'],
  priority: 2,
});

// Pesquisa satisfação
await sendNotification({
  userId: clienteId,
  title: '⭐ Avalie seu Atendimento',
  message: 'Como foi sua experiência conosco?',
  type: 'info',
  category: 'social',
  sourceSystem: 'hello',
  channels: ['whatsapp', 'email'],
  priority: 0,
});
```

---

## 7️⃣ MULTIPLIXE

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/CursosPage.tsx

// Curso iniciado
await sendNotification({
  userId: alunoId,
  title: '🎓 Curso Iniciado',
  message: `Bem-vindo ao ${curso.nome}!`,
  type: 'success',
  category: 'system',
  sourceSystem: 'multiplixe',
  channels: ['in_app', 'email'],
  priority: 1,
});

// Certificado disponível
await sendNotification({
  userId: alunoId,
  title: '🏆 Certificado Disponível',
  message: `Parabéns! Seu certificado de ${curso.nome} está pronto.`,
  type: 'success',
  category: 'system',
  sourceSystem: 'multiplixe',
  channels: ['in_app', 'email', 'whatsapp'],
  priority: 1,
  actionUrl: `/certificados/${certificadoId}`,
  actionLabel: 'Baixar Certificado',
});

// Lembrete aula agendada
await sendNotification({
  userId: alunoId,
  title: '📅 Lembrete de Aula',
  message: `Aula de ${modulo.nome} começa em 1 hora`,
  type: 'info',
  category: 'reminder',
  sourceSystem: 'multiplixe',
  channels: ['in_app', 'push', 'whatsapp'],
  priority: 1,
});
```

---

## 8️⃣ SALESPRO CRM

### Features: Push ❌ | SMS 🟡 | WhatsApp ✅

**Prioridade:** 🔴 P1

### Implementação:

```typescript
// src/pages/OportunidadesPage.tsx

// Nova oportunidade
await sendNotification({
  userId: vendedorId,
  title: '💰 Nova Oportunidade',
  message: `${cliente.nome} - R$ ${valor} - ${produto}`,
  type: 'info',
  category: 'social',
  sourceSystem: 'salespro',
  sourceEntityType: 'oportunidade',
  sourceEntityId: oportunidadeId,
  channels: ['in_app', 'push', 'whatsapp'],
  priority: 1,
  actionUrl: `/oportunidades/${oportunidadeId}`,
});

// Follow-up vencido
await sendNotification({
  userId: vendedorId,
  title: '⏰ Follow-up Vencido',
  message: `${cliente.nome} - Última interação: ${dias} dias atrás`,
  type: 'warning',
  category: 'reminder',
  sourceSystem: 'salespro',
  channels: ['in_app', 'email', 'sms'],
  priority: 2,
});

// Venda fechada
await sendNotification({
  userId: gestorId,
  title: '🎉 Venda Fechada!',
  message: `${vendedor.nome} fechou ${cliente.nome} - R$ ${valor}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'salespro',
  channels: ['in_app', 'whatsapp'],
  priority: 1,
});

// Meta atingida
await sendNotification({
  userId: vendedorId,
  title: '🏆 Meta Atingida!',
  message: `Parabéns! Você atingiu ${percentual}% da meta mensal`,
  type: 'success',
  category: 'system',
  sourceSystem: 'salespro',
  channels: ['in_app', 'email', 'whatsapp'],
  priority: 1,
});
```

**Casos de Uso Críticos:**
1. Nova lead → Notificar vendedor (imediato)
2. Oportunidade quente → SMS + WhatsApp
3. Follow-up vencido → Lembrete diário
4. Pipeline travado (>7 dias) → Alerta gestor
5. Venda fechada → Celebrar equipe

---

**STATUS:** ✅ 8/16 sistemas documentados
**PRÓXIMO:** Sistemas 9-12 (Loggi-Flow, ZAPP, Fast Grava, Match)
