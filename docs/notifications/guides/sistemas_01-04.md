# 🔔 GUIA IMPLEMENTAÇÃO - SISTEMAS 1-4

## 1️⃣ SISTEMA DE COMPRAS

### Features: Push ❌ | SMS 🟡 | WhatsApp 🟡

**Prioridade:** 🔴 P1

### Implementação:

```typescript
// src/pages/PedidosPage.tsx
import { NotificationCenter } from '@/components/NotificationCenter';
import { sendNotification } from '@/lib/notifications';

// Header
<NotificationCenter />

// Ao criar pedido que precisa aprovação
await sendNotification({
  userId: aprovadorId,
  title: 'Novo Pedido para Aprovação',
  message: `Pedido #${pedidoId} - ${fornecedor} - R$ ${valor}`,
  type: 'urgent',
  category: 'approval',
  sourceSystem: 'compras',
  sourceEntityType: 'pedido',
  sourceEntityId: pedidoId,
  channels: ['in_app', 'email', 'push', 'sms'],
  priority: 3,
  actionUrl: `/compras/pedidos/${pedidoId}`,
  actionLabel: 'Aprovar/Rejeitar',
});
```

**Casos de Uso:**
1. Pedido criado → Notificar aprovador (URGENTE)
2. Pedido aprovado → Notificar solicitante
3. Pedido entregue → Notificar recebimento
4. Valor > R$ 10k → SMS adicional

---

## 2️⃣ ESTOKI WMS

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🔴 P1

### Implementação:

```typescript
// src/pages/EstoquePage.tsx
import { NotificationHelpers } from '@/lib/notifications';

// Alerta estoque baixo
if (produto.quantidade <= produto.estoque_minimo) {
  await sendNotification({
    userId: gestorId,
    title: '⚠️ Estoque Baixo',
    message: `${produto.nome}: ${produto.quantidade} unidades (mínimo: ${produto.estoque_minimo})`,
    type: 'warning',
    category: 'alert',
    sourceSystem: 'wms',
    sourceEntityType: 'produto',
    sourceEntityId: produto.id,
    channels: ['in_app', 'email', 'push'],
    priority: 2,
  });
}

// Entrada confirmada
await sendNotification({
  userId: solicitanteId,
  title: 'Entrada Confirmada',
  message: `${quantidade}x ${produto.nome} - NF ${notaFiscal}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'wms',
  channels: ['in_app'],
  priority: 1,
});
```

**Casos de Uso:**
1. Estoque mínimo atingido → Alerta gestor
2. Produto vencendo (30 dias) → Alerta
3. Entrada confirmada → Notificar solicitante
4. Inventário iniciado → Notificar equipe

---

## 3️⃣ DP SYSTEM

### Features: Push ❌ | SMS 🟡 | WhatsApp 🟡

**Prioridade:** 🟢 P2

### Implementação:

```typescript
// src/pages/ColaboradoresPage.tsx

// Aniversário colaborador
await sendNotification({
  userId: rh_id,
  title: '🎂 Aniversariante do Dia',
  message: `${colaborador.nome} está fazendo aniversário hoje!`,
  type: 'info',
  category: 'social',
  sourceSystem: 'dp',
  channels: ['in_app', 'email'],
  priority: 0,
});

// Documento vencendo
await sendNotification({
  userId: colaborador.user_id,
  title: 'Documento Vencendo',
  message: `Seu ${documento.tipo} vence em ${dias} dias. Favor providenciar renovação.`,
  type: 'warning',
  category: 'reminder',
  sourceSystem: 'dp',
  channels: ['in_app', 'email', 'sms'],
  priority: 2,
});

// Férias aprovadas
await sendNotification({
  userId: colaborador.user_id,
  title: '✈️ Férias Aprovadas',
  message: `Suas férias de ${dataInicio} a ${dataFim} foram aprovadas!`,
  type: 'success',
  category: 'approval',
  sourceSystem: 'dp',
  channels: ['in_app', 'email', 'whatsapp'],
  priority: 1,
});
```

**Casos de Uso:**
1. Aniversário → Notificar RH
2. Documento vencendo → Lembrete colaborador
3. Férias aprovadas/rejeitadas → Notificar
4. Ponto irregular → Alerta gestor

---

## 4️⃣ TASKGIFTS

### Features: Push ❌ | SMS ❌ | WhatsApp 🟡

**Prioridade:** 🟡 P3

### Implementação:

```typescript
// src/pages/TasksPage.tsx

// Task atribuída
await sendNotification({
  userId: responsavelId,
  title: '📋 Nova Task Atribuída',
  message: `${task.titulo} - Prazo: ${task.prazo}`,
  type: 'info',
  category: 'reminder',
  sourceSystem: 'taskgifts',
  sourceEntityType: 'task',
  sourceEntityId: task.id,
  channels: ['in_app', 'email'],
  priority: 1,
  actionUrl: `/tasks/${task.id}`,
  actionLabel: 'Ver Task',
});

// Task vencendo (24h)
await sendNotification({
  userId: task.responsavel_id,
  title: '⏰ Task Vencendo',
  message: `${task.titulo} vence amanhã!`,
  type: 'warning',
  category: 'reminder',
  sourceSystem: 'taskgifts',
  channels: ['in_app', 'email', 'push'],
  priority: 2,
});

// Task concluída
await sendNotification({
  userId: task.criador_id,
  title: '✅ Task Concluída',
  message: `${responsavel.nome} concluiu: ${task.titulo}`,
  type: 'success',
  category: 'system',
  sourceSystem: 'taskgifts',
  channels: ['in_app'],
  priority: 0,
});
```

**Casos de Uso:**
1. Task criada → Notificar responsável
2. Task vencendo (24h) → Lembrete
3. Task atrasada → Alerta diário
4. Task concluída → Notificar criador
5. Comentário em task → Notificar participantes

---

**STATUS:** ✅ 4/16 sistemas documentados
**PRÓXIMO:** Sistemas 5-8 (FUXICO, HELLO, MULTIPLIXE, SalesPro)
