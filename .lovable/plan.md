
E3/E5 — Recomendação "Continue de onde parou" inteligente.

## Mudanças

**1. `ContinueLearningWidget.tsx`** — refinar lógica de seleção. Hoje usa `userProgress.find()` pegando o primeiro com 0 < progress < 100. Substituir por priorização:
   - **P1**: Última aula iniciada não concluída — ordenar `userProgress` por `last_accessed_at` desc.
   - **P2**: Próximo curso da trilha ativa — se nenhuma aula em andamento, sugerir próximo curso da trilha do usuário.
   - **P3**: Curso favoritado sem progresso — fallback final via `useFavorites`.

**2. Props** — expandir `ContinueLearningWidgetProps`:
   - Manter `userProgress` (P1).
   - Adicionar `learningPathSuggestion?: { course, pathName }` (P2).
   - Adicionar `favoriteSuggestion?: CourseData` (P3).

**3. UI** — badge dinâmico de origem:
   - P1: "Continue de onde parou" (Flame).
   - P2: "Próximo na trilha [nome]" (Route).
   - P3: "Você favoritou" (Heart).

**4. `Dashboard.tsx`** — calcular as 3 fontes e passar como props. Reusar hooks já carregados (`useUserProgress`, `useLearningPaths`, `useFavorites`) sem novas queries pesadas.

**5. Teste** — `src/test/continueLearning.test.ts` cobrindo priorização P1→P2→P3 e ausência total (retorna null).

## Aceite
Widget exibe recomendação correta por prioridade · badge reflete origem · não renderiza sem fontes · teste passa · zero regressão.

Depois: E4 — Web Share API real para conquistas.
