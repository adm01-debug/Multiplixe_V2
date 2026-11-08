# AGENTS.md — Multiplixe_V2

Regras do dono para qualquer agente de IA; vencem `README.md`, `DOCUMENTACAO.md` e os `PLANO_*.md`
(histórico). Detalhe em `docs/agentes/<tema>.md`; divergiu da realidade → corrija no mesmo PR do fix.
Responda sempre em PT-BR.

## Postura
- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável (avise na PR).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; `docs/agentes/mapa-repo.md` antes de buscar por texto; exploração
  ampla → subagente; nenhuma tool "por garantia"; não gere código que não será aplicado.
- Continuidade: `progress.txt` na raiz é o diário entre sessões — leia antes de mexer, escreva no fim.
- Segredos nunca em código, commit ou resposta — só em secret do serviço (edge: Lovable Cloud → Secrets).
  Chave exposta em chat ou em código → rotacionar na hora e avisar. Nunca imprima nem commite `.env`,
  `service_role` ou token. Já existe um caso aberto no repo: ver `docs/agentes/regras-dominio.md`.

## Bugs e funcionalidades
- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida.
- Antes da PR: `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint <arquivos tocados>` e
  `npx vitest run <caminho>` do que tocou. Só erro seu conta; erro herdado da `main` → "Próximos passos".
- "Pronto" = PR mergeada + deploy confirmado (Vercel, ver `docs/agentes/lovable-vercel.md`) + comportamento
  verificado (log, query ou request real); faltou um → diga onde parou.
- Funcionalidade pronta = integrada ponta a ponta (rota em `src/App.tsx`, entrada na UI, hook chamado, edge
  function existente e invocada, tabela com RLS, estados erro/loading/vazio, submit), sem mock, hardcode ou
  TODO. Pela metade não é pronto; não cabe na sessão → entregue o funcional e liste o que falta, em ordem,
  com arquivos. Nunca deixe código morto ou feature "quase" sem dizer.
- Arquivos gerados pelo Lovable são proibidos de editar à mão: `src/integrations/supabase/client.ts`,
  `src/integrations/supabase/types.ts`, `src/integrations/lovable/index.ts`.

## Comunicação
- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`
- Repo `adm01-debug/Multiplixe_V2`, `main`, **privado**. Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`**
  (`github_push_files`: `files` + `delete` num commit); `git push` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- **O Lovable commita direto na `main`** (`Visual edit in Lovable`, `VibeDeploy: …`) — 104 dos 110 commits são
  do bot. Re-sync antes de editar; nunca force-push em `main`; conflito com mudança do Lovable → rebase.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`).
- Branch de `main` atualizado: `claude/<fix|feat|chore|infra>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto ≥10 chars, sem ponto>`; tipos
  `feat fix docs style refactor perf test build ci chore security revert` (branch `infra` → commit `ci:`/`chore:`).
  **Não há hook de commit neste repo** (sem `.husky/`): a convenção vale por disciplina, ninguém barra.
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência.
- Mergeie sem aprovação (squash, apague a branch) PR sua pronta: sem conflito, escopo comum (front, edge
  function, docs, config). O único CI é `.github/workflows/guardas.yml` (testes dos geradores, uso do
  Supabase, integridade das instruções) — build, lint e typecheck continuam sendo prova local, citada na PR.
  **Deixe aberta e chame o dono**: DDL/migration; segredos e rotação de chave; criar `.github/workflows/`;
  deleção de dado; arquitetura ou custo; conflito com PR de outro agente.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch.
- Merge = produção: `main` dispara deploy no Vercel. Confira o deploy e reporte.
- Ao mexer em `AGENTS.md` ou `docs/agentes/`: `node scripts/ci/check-claude-md-integrity.mjs` antes do PR.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy
- Oficial: projeto Supabase/Lovable Cloud **`gyqtndkjvwvtkfeaxtlv`** (`supabase/config.toml:1`).
- **Nenhum MCP desta sessão aponta para ele** (checado: `SUPABASE - GESTÃO DE CLIENTES` =
  `pgxfvjmuubtbowutlide`, `SUPABASE - GESTÃO DE PRODUTOS` = `doufsxqlfjyuvxuezpln`, `SUPABASE - ZAPP WEB V2`
  = `tnnnlkbymytvtqngbbqh`). Sem MCP não há SQL por agente: diagnóstico de banco e qualquer DDL = **chame o
  dono** (Lovable Cloud → SQL Editor). Nunca invente resultado de query.
- **NÃO escrever** em `pgxfvjmuubtbowutlide` (CRM, outro sistema), `doufsxqlfjyuvxuezpln` (Catálogo) nem
  `tnnnlkbymytvtqngbbqh` (Zapp Web V2) — MCPs carregados nesta sessão não são deste projeto.
- Migration é gerada e aplicada pelo **Lovable**, que depois commita o arquivo em `supabase/migrations/`
  (49 arquivos). Nunca escreva `.sql` ali esperando que algo aplique: não há CI nem CLI neste fluxo.
- A estrutura declarada é `src/integrations/supabase/types.ts` (gerado): 61 tabelas, 1 view
  (`quiz_options_public`), 32 funções. Papel sempre por `user_roles` + RPC `has_role` — nunca em `profiles`.

## Serviços
- **Lovable / Vercel** — ler `docs/agentes/lovable-vercel.md` ao confirmar deploy, mexer em env var, domínio
  ou edge function. Lovable é o autor do código e o dono de `.env`, migrations e secrets; Vercel
  (`multiplixe-v2`, team `juca1`) é o deploy automático da `main`; edge functions sobem pelo Lovable.
- **GitHub** — ler `docs/agentes/github-ci.md` ao mexer em settings, branch protection ou workflows. Hoje:
  zero workflow, zero branch protection, merge livre (squash/merge/rebase ligados).
- **Regras de domínio** — ler `docs/agentes/regras-dominio.md` ao mexer em login, papéis, XP/gamificação,
  certificado, rate limit/MFA ou rotas.

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`
- Vite 5 + React 18 + TS 5 + Tailwind 3 + shadcn/ui (`src/`), Supabase/Lovable Cloud
  (`supabase/functions/` Deno, `supabase/migrations/`), Vitest + Testing Library (`src/test/`), Node 24 no Vercel.
- `npm install` (há `package-lock.json`; `bun.lock`/`bun.lockb` também estão versionados — não troque de
  gerenciador no mesmo PR).
- **`npm test` não existe** (`package.json` tem `dev`, `build`, `build:dev`, `lint`, `preview` e os de
  inventário/guards abaixo): use `npx vitest run <caminho>`. Typecheck: `npx tsc --noEmit -p tsconfig.app.json` (`strict: false`,
  `noImplicitAny: false` — erro de tipo novo é seu, não do config). Lint: `npx eslint <arquivos>`.
  Build: `npm run build`.
- `@playwright/test` está em `dependencies` mas **não há E2E** (sem `e2e/`, sem `playwright.config.*`):
  não prometa teste de ponta a ponta.
- Inventário e guards (só Node, sem dependência): `npm run inventario` (refaz `inventario/`),
  `npm run inventario:check`, `npm run contexto:ia`, `npm run guard:supabase`, `npm run guards`
  (`node --test scripts/ci/*.unit.mjs`); com `INVENTARIO_CHECK=1` os testes também cobram o frescor do
  inventário commitado. Detalhe em `inventario/README.md` e `scripts/ci/README.md`.
- Antes de qualquer tarefa: `inventario/ia/INDEX.md`, `progress.txt`, `docs/agentes/mapa-repo.md` e, se o
  tema for banco/deploy/regra, o `docs/agentes/<tema>.md` correspondente.

## Grafo de código
Não há `graphify`, mas há **inventário gerado por script** — use antes de `grep`. A ordem é:
`inventario/ia/INDEX.md` (mapa do repo, números, rotas, edges, alertas de banco) → o JSON que responde a
pergunta (`inventario/estado/rotas.json`, `edges.json`, `schema-declarado.json`, `inventario/ia/hooks.json`,
`componentes.json`, `grafo.json`) → `docs/agentes/mapa-repo.md` → `rg`/`grep` com caminho restrito →
leitura por faixa de linhas. Tabela completa em `inventario/README.md`. Não varra o repo inteiro para achar
uma função: 373 arquivos em `src/`.
- Mudou rota, edge function, migration ou import? Regere com `npm run inventario` e commite junto; o
  inventário desatualizado é pior que nenhum. Quem cobra frescor é o cron semanal
  (`.github/workflows/inventario-estado-semanal.yml`), não o check de PR.
- `inventario/estado/banco.json` (banco ao vivo) só existe depois de consulta real: sem
  `SUPABASE_ACCESS_TOKEN` no Actions, é o dono rodando `scripts/inventario/banco.sql` no SQL Editor e
  `node scripts/inventario/gerar-banco.mjs --entrada <arquivo>`. Nunca invente número de banco.
