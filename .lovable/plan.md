
Item 19/23 — Otimização de queries Supabase.

## Mudanças

**1. Auditar `select('*')` em hooks de listagem** e trocar por colunas específicas:
- `src/hooks/usePlaybooks.ts` — listar apenas `id, title, slug, summary, category, cover_url, created_at` (não buscar `content` pesado em listagem).
- `src/hooks/useTrainingVideos.ts` — selecionar campos do card.
- `src/hooks/useLearningPaths.ts` — colunas mínimas para grid.
- `src/hooks/useNotifications.ts` — `id, title, message, type, read, created_at`.

**2. Paginação/limit em queries que podem crescer:**
- `useNotifications` — `.limit(50)` (mais antigas via "carregar mais").
- `useLeaderboard` / `useDepartmentLeaderboard` — confirmar `.limit(100)`.
- `useXPHistory` — `.limit(30)` para o gráfico (últimos 30 dias).

**3. `.order()` explícito** em todas listagens para resultado determinístico (evita reordenação no client).

**4. Detalhe vs listagem** — em hooks de detalhe (`usePlaybook(slug)`, `useCourse(slug)`) manter `select('*')` ou expandir relações com `select('*, lessons(*)')` apenas onde necessário.

**5. Migration sugerida (índices)** — criar índices para colunas frequentemente filtradas/ordenadas que ainda não tenham:
- `playbooks(created_at desc)`, `notifications(user_id, read, created_at desc)`, `user_xp_history(user_id, created_at desc)`.
- Aplicar via tool de migração (índices `IF NOT EXISTS`, sem locks longos).

## Aceite
Build OK · payload de listagens reduzido · sem regressão funcional · queries determinísticas · índices presentes para os filtros mais quentes.

Depois: Item 20 — Memoização e re-render hygiene (React.memo, useCallback/useMemo onde mede ganho).
