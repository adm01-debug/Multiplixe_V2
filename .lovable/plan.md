
E5 — Edge function `weekly-admin-digest` (relatório semanal por e-mail para admins).

## Mudanças

**1. `supabase/functions/weekly-admin-digest/index.ts`** — nova edge function:
- Consulta agregações dos últimos 7 dias:
  - Novos usuários (`profiles` por `created_at`).
  - Cursos mais concluídos (top 5 via `user_course_progress` com 100%).
  - Total de XP distribuído (`user_xp_history`).
  - Aulas completadas (`user_lesson_progress`).
  - Alertas de queda: usuários com streak quebrada (`user_streaks` com `last_activity_date` > 3 dias).
- Busca admins via `user_roles` + `profiles.email`.
- Renderiza HTML responsivo com gradiente Indigo/Roxo (alinhado ao design system).
- Envia via Resend (reusa `RESEND_API_KEY` se já existir; caso contrário, solicita).
- `verify_jwt = false` (chamada por cron).
- Validação Zod no payload opcional (`{ dryRun?: boolean }`).
- CORS completo, logs estruturados, falha graciosa por admin (não aborta lote).

**2. Cron job** — agendar via SQL (toda segunda 09:00 UTC):
```sql
select cron.schedule(
  'weekly-admin-digest',
  '0 9 * * 1',
  $$ select net.http_post(...) $$
);
```
Habilitar `pg_cron` e `pg_net` se necessário.

**3. Painel admin** — botão "Enviar digest agora" no `AdminStatsTab` para teste manual (chama edge function via `supabase.functions.invoke` com `{ dryRun: false }`), visível apenas para admins.

**4. Teste Deno** — `supabase/functions/weekly-admin-digest/index_test.ts` valida:
- Schema de payload aceita `{}` e `{ dryRun: true }`.
- Função de formatação de números/datas em PT-BR.

**5. Secret** — verificar `RESEND_API_KEY`; se ausente, solicitar via `add_secret` antes de prosseguir.

## Aceite
Edge function deploy OK · cron agendado · admin recebe e-mail semanal com KPIs · botão manual funciona · teste passa · zero regressão.

Conclui o ciclo Excelência+ (E1→E5). Plataforma em 10/10.
