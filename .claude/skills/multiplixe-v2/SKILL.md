---
name: multiplixe-v2
description: Convenções de código e commit do Multiplixe V2 (TypeScript, React, Conventional Commits). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# Multiplixe V2 — convenções

As regras de trabalho (banco, fluxo Git, PR, comunicação) estão em `AGENTS.md` na raiz — este skill só
resume convenções de código e commit.

## Commits

Padrão Conventional Commits: `<tipo>(<escopo>): <descrição>` — escopo opcional e minúsculo; assunto com pelo
menos 10 caracteres, sem ponto final; tipos: `feat fix docs style refactor perf test build ci chore security
revert`. Mensagem em PT-BR, modo imperativo, primeira linha curta. **Não há hook de `commit-msg` neste
repo** — a convenção vale por disciplina.

Exemplo: `fix(player): credita XP só quando a aula fecha`

## Código

- Linguagem: TypeScript (front Vite + React 18 em `src/`, edge functions Deno em `supabase/functions/`).
- Funções `camelCase`, componentes `PascalCase`, constantes `SCREAMING_SNAKE_CASE`; hook = 1 arquivo
  `useAlgo.ts` em `src/hooks/`.
- Exports nomeados (exceto páginas, que usam `export default`); siga o padrão de import do arquivo vizinho
  (alias `@/` → `src/`).
- UI com shadcn/ui em `src/components/ui/` (gerado — componha, não reescreva) e tokens do Tailwind; nada de
  cor literal onde há token.
- Dados pelo Supabase client (`@/integrations/supabase/client`) dentro de hook + React Query; componente não
  chama `supabase` direto quando já existe hook do domínio.
- Testes em `src/test/<assunto>.test.ts(x)` (Vitest + Testing Library, jsdom); rode só o que tocou:
  `npx vitest run src/test/<arquivo>.test.ts`. **`npm test` não existe.**
- Nunca editar os arquivos gerados pelo Lovable: `.env`, `src/integrations/supabase/client.ts`,
  `src/integrations/supabase/types.ts`, `src/integrations/lovable/index.ts`.
- Siga os padrões já existentes no módulo; não desvie sem motivo registrado na PR.
