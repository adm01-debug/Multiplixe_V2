
Sprints anteriores entregues: Sales Enablement + Excelência + Perfeição + Transcendência + Apoteose. Falta consolidar a última milha: testes da apoteose, atualizar atalhos no modal de ajuda, KeyboardShortcutsModal com `n`/`g r`, e docs.

# Sprint Coroação — fechamento final 10/10

## 1. KeyboardShortcutsModal atualizado
- Renderizar todos os atalhos de `SHORTCUTS_LIST` (já inclui `g r`, `g t`, `n`)
- Garantir invocação via `?` (já feito em `useGlobalShortcuts`)

## 2. Testes da Sprint Apoteose (+25 testes alvo)
- `commandPalette.test.tsx` — render + busca global mockada
- `playbookComments.test.tsx` — add / edit / delete (hooks + UI)
- `aiQuizGeneratorModal.test.tsx` — render + invoke mock
- `globalSearch.test.ts` — debounce + agrupamento por tipo
- `i18n.test.ts` — `useT()` + troca de locale + persistência
- `optimisticFavorites.test.tsx` — rollback em erro
- `engagementHeatmap.test.tsx` — render com dados mock
- `cohortRetention.test.tsx` — render com dados mock
- `shortcutsExpanded.test.ts` — `g r`, `g t`, `n` presentes em SHORTCUTS_LIST

## 3. Documentação final
- `DOCUMENTACAO.md`: seções IA aplicada, comentários, recomendações, i18n, atalhos, sitemap dinâmico, métricas avançadas
- `README.md`: rotas (`/onboarding/executar`), atalhos (`g r`, `g t`, `n`, `?`), edge functions (`ai-playbook-summarize`, `ai-quiz-generator`, `export-user-data`, `generate-sitemap`)

## 4. Sanidade final
- Rodar suíte (alvo 340+ testes verdes)
- Verificar zero `console.*` e zero `any` nos arquivos novos

## Padrões mantidos
≤400 linhas/arquivo, zero `any`/`console.*`, tokens semânticos, RLS com `has_role`, TanStack Query + invalidação correta, Lovable AI Gateway.

## Ordem de execução
1. Atualizar `KeyboardShortcutsModal` para listar `SHORTCUTS_LIST` completo
2. Criar 9 arquivos de teste cobrindo Sprint Apoteose
3. Atualizar `DOCUMENTACAO.md` e `README.md`
4. Conferir suíte completa e fechar 10/10
