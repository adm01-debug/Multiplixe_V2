# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em settings do repo, branch protection, `.github/workflows/` ou quando um merge falhar de
forma estranha.

## Escrita no GitHub

- Repo `adm01-debug/Multiplixe_V2` (grafia canônica; a API aceita `multiplixe_v2`), branch `main`,
  **privado**, sem license, sem wiki, sem discussions, issues ligadas (0 abertas).
- **Escrita: MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). O MCP padrão do GitHub retorna 403 em
  write nos repos `adm01-debug`. `github_push_files` **sobrescreve** o arquivo — mande o conteúdo integral
  com apenas a mudança semântica e confira depois que o arquivo remoto bate com o que você testou. Aceita
  `files` e `delete` no mesmo commit (1 commit atômico).
- Commits: `<tipo>(<escopo>): <assunto>` com assunto ≥ 10 caracteres e sem ponto final; tipos
  `feat fix docs style refactor perf test build ci chore security revert`. `infra` só como tipo de **branch**
  (`claude/infra-…`); no commit use `ci:` ou `chore:`. **Não há `.husky/` neste repo** — nenhum hook valida
  mensagem, lint ou typecheck. O histórico tem commits fora de qualquer padrão (`Changes`, `Visual edit in
  Lovable`): não copie, siga a convenção.
- Para listar PRs abertas com os arquivos que tocam numa chamada só, use `github_graphql`
  (`pullRequests(states:OPEN){ nodes { number headRefName files(first:30){ nodes { path } } } }`).

## O Lovable commita direto na `main`

112 commits no total (contagem em 2026-11-08, cresce a cada push do Lovable): **104 de
`gpt-engineer-app[bot]`** (Lovable), 6 de `adm01-debug`, 2 de agente via
Claude Code. Mensagens típicas: `Visual edit in Lovable`, `VibeDeploy: …`, `Changes`.

- A `main` se move sem passar por PR. **Re-sync antes de editar** (`git fetch origin main`) e confira que o
  último commit da sua branch é seu antes do push.
- Conflito com mudança do Lovable: rebase da **sua** branch em `main`, `--force-with-lease` só nela. Nunca
  force-push na `main`, nunca reverta commit do Lovable sem ordem do dono (ele perde o estado no editor).
- Arquivos que o Lovable regenera e sobrescreve: `.env`, `src/integrations/supabase/client.ts`,
  `src/integrations/supabase/types.ts`, `src/integrations/lovable/index.ts`, `.lovable/plan.md`,
  `supabase/migrations/*`. Mudança sua nesses arquivos tende a ser perdida.
- Precedente real: `migrate-helper` foi apagada por `a124f9f` (`security: remove migrate-helper edge
  function (exposes service_role key)`) e **voltou** no commit seguinte do Lovable (`580966a`). Remoção de
  arquivo que o editor conhece precisa ser feita também no Lovable, senão volta.

## Perímetro do GitHub — estado canônico

**Regra:** qualquer mudança nos campos abaixo atualiza **esta tabela** no mesmo PR.

| Campo | Estado canônico (lido em 2026-11-08) |
|---|---|
| Branch protection | **nenhuma regra** (`branchProtectionRules` vazio) — `main` aceita push direto |
| Required status checks | nenhum (não há CI) |
| Workflows em `.github/workflows/` | **zero** (`github_list_workflows` → `total_count: 0`; não existe `.github/` no repo) |
| Merge | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=false` · `delete_branch_on_merge=false` · `allow_update_branch=false` |
| Squash | `squash_merge_commit_message=COMMIT_MESSAGES` · `squash_merge_commit_title=COMMIT_OR_PR_TITLE` |
| Branches remotas | `main` e `master`; `master` parou em `b81fdbf` (import inicial, já dentro da `main` por `2a8e3e7`) — podável |
| Homepage do repo | `https://multiplixe-v2.vercel.app` |
| Secret scanning | **desligado** (`github_list_secret_scanning_alerts` → 404 "Secret scanning is disabled on this repository") |
| Dependabot alerts | **desligado** (`github_list_dependabot_alerts` → 403 "Dependabot alerts are disabled for this repository") |

Consequências:
- **Nenhum alerta automático pega segredo commitado.** Com os dois acima desligados, uma chave exposta num
  commit (como a `ACCESS_KEY` hardcoded em `supabase/functions/migrate-helper/index.ts`, ver
  `docs/agentes/regras-dominio.md`) só é pega por revisão humana ou de agente — nunca pelo GitHub. Ligar os
  dois é mudança de settings do repo: **chame o dono**.
- **Nada barra um merge ruim.** Sem CI, a única prova é o que você rodou local — cite na PR o comando e a
  saída (`npx tsc --noEmit -p tsconfig.app.json`, `npx vitest run <caminho>`, `npx eslint <arquivos>`).
- `delete_branch_on_merge=false`: apague a branch você mesmo depois do merge.
- `allow_auto_merge=false`: não existe auto-merge; mergeie na mão quando a PR estiver pronta.
- Criar `.github/workflows/` (CI, deploy, guard) **é item de "chame o dono"**: mexe em permissão de token e
  em custo de Actions. Deixe a PR aberta e avise.

## Guards que você pode rodar antes do PR

- `node scripts/ci/check-claude-md-integrity.mjs` — exige os cabeçalhos do `AGENTS.md` e barra o conjunto
  `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30% (ou >50% em um arquivo) contra a base.
  Rode sempre que mexer em `AGENTS.md` ou `docs/agentes/`. Com `CLAUDE_MD_BASE=origin/main` compara com a
  `main`; sem a variável, com o `HEAD`.
- `node --test scripts/ci/*.unit.mjs` — `npm run guards`. Entre eles, `a11y-input-labels.unit.mjs` barra
  `<Input>` novo sem nome acessível (`id` casado com `<Label htmlFor>` ou `aria-label`) e `htmlFor` órfão.
  É o mesmo passo que o job `guardas` roda em `push`/PR — ver `scripts/ci/README.md`.
