
Item 11/23 — Índices DB para performance.

## Migration
Criar índices em colunas de alto tráfego de leitura:
- `user_lesson_progress(user_id, is_completed)` — dashboard/stats
- `user_course_progress(user_id, progress_percentage)` — recommendations/dashboard
- `user_xp_history(user_id, created_at DESC)` — XP evolution chart
- `notifications(user_id, is_read, created_at DESC)` — bell
- `audit_logs(user_id, created_at DESC)` e `audit_logs(resource_type, resource_id)` — auditoria
- `user_streaks(last_activity_date)` — cron streak risk
- `playbook_views(playbook_id, viewed_at DESC)` — register_playbook_view
- `user_assessment_results(user_id, assessment_id, completed_at DESC)` — get_due_assessments
- `lessons(course_id, order_index)` — player sidebar
- `quiz_questions(quiz_id)` e `quiz_options(question_id)` — submit_quiz_attempt

Todos com `CREATE INDEX IF NOT EXISTS`.

## Aceite
Migration aplicada · zero impacto em código · queries críticas aceleradas.

Depois: Item 12 (Lazy load + code splitting agressivo nas rotas restantes).
