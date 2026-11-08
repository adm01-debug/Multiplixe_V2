# scripts/ci

Guardas que o agente roda **à mão** antes de abrir PR. Este repo não tem GitHub Actions
(`docs/agentes/github-ci.md`): nada aqui roda sozinho.

## `check-claude-md-integrity.mjs`

Protege as instruções para agentes de serem apagadas ou esvaziadas por outra sessão (o Lovable commita
direto na `main` e várias sessões escrevem no mesmo repo).

Verifica:
1. `AGENTS.md` existe;
2. os 8 cabeçalhos obrigatórios estão presentes (`## Postura`, `## Bugs e funcionalidades`,
   `## Comunicação`, `## Fluxo Git`, `## Banco`, `## Serviços`, `## Stack e comandos`,
   `## Grafo de código`);
3. o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` não encolheu mais de **30%** em bytes
   contra a base;
4. nenhum arquivo vigiado individualmente (o `AGENTS.md` e cada `docs/agentes/*.md` que exista na base)
   sumiu ou encolheu mais de **50%**. `CLAUDE.md` fica de fora: é só `@AGENTS.md`.

Como rodar:

```sh
node scripts/ci/check-claude-md-integrity.mjs                          # compara com o HEAD
CLAUDE_MD_BASE=origin/main node scripts/ci/check-claude-md-integrity.mjs   # compara com a main
```

Exit 0 = passou; exit 1 = possível wipe (a mensagem diz qual arquivo e quanto encolheu). Mudança legítima
que encolhe muito (ex.: mover uma seção inteira para outro arquivo) ainda passa pelo limiar do conjunto —
se não passar, divida em dois PRs ou explique no corpo da PR.

Quando adicionar uma seção nova ao `AGENTS.md`, atualize `REQUIRED_SECTIONS` no script e a lista acima no
**mesmo PR**.
