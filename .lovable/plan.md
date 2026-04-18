
P2 — Toast helpers com action buttons (Desfazer / Ver).

## Mudanças

**1. `src/lib/toastHelpers.ts`** — interface `ToastAction` já existe e é repassada. Sem mudanças estruturais; apenas garantir tipagem exportada (`export type ToastAction`) para reuso.

**2. `src/hooks/useFavorites.ts`** — ao remover favorito, exibir toast com ação "Desfazer" que chama `addFavorite.mutate(courseId)`. Ao adicionar, manter toast simples (ação inversa via botão de favorito já é trivial).

**3. `src/hooks/useAchievements.ts`** — ao desbloquear conquista (em `checkAchievements`), além do modal de celebração, disparar `toastSuccess` com action "Ver conquistas" → navega para `/perfil?tab=conquistas` (ou rota equivalente). Garantir que não duplique com o modal: só mostra toast se modal não estiver visível ou como reforço passivo.

**4. `src/components/share/ShareAchievement.tsx`** — após share bem-sucedido, toast com action "Compartilhar outra" abrindo o seletor novamente (opcional, baixo custo).

**5. Teste** — estender `src/test/toastHelpers.test.ts` (já cobre `action`). Adicionar caso em `useFavorites` test (se existir) validando callback de undo.

## Aceite
Undo funciona em remoção de favorito · toast de conquista navega para perfil · zero regressão · acessível (botão de ação focável).

Depois: P3 — Prefetch nos cards.
