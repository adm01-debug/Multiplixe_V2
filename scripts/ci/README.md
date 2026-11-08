# scripts/ci

Guardas que o agente roda **à mão** antes de abrir PR. Este repo não tem GitHub Actions
(`docs/agentes/github-ci.md`): nada aqui roda sozinho.

## `check-claude-md-integrity.mjs`

Protege as instruções para agentes de serem apagadas ou esvaziadas por outra sessão (o Lovable commita
direto na `main` e várias sessões escrevem no mesmo repo).

Verifica, nessa ordem:
1. `AGENTS.md` existe;
2. `CLAUDE.md` existe e é **exatamente** `@AGENTS.md` (é o arquivo que o Claude Code lê no boot; fica
   fora do limite de bytes do item 4, então sem este check podia ser esvaziado ou apontar para outro
   arquivo sem o guard notar);
3. os 8 cabeçalhos obrigatórios estão presentes como **heading real** — início de linha, fora de bloco de
   código (` ``` `) ou comentário HTML (`<!-- -->`), e não como prefixo de um heading maior (ex.:
   `### Postura antiga` não conta como `## Postura`, mas um heading com sufixo como
   `## Banco — ler docs/agentes/banco.md` conta);
4. o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/**/*.md` (recursivo — conta subpastas também) não
   encolheu mais de **30%** em bytes contra a base;
5. nenhum arquivo vigiado individualmente (o `AGENTS.md` e cada `docs/agentes/**/*.md` que exista na base)
   sumiu ou encolheu mais de **50%**.

Se a base (`CLAUDE_MD_BASE`) não puder ser resolvida — ref inexistente, sem `git` no PATH, fora de um
repositório git — os itens 4 e 5 são **pulados**, mas o script avisa alto com `::warning::` em vez de
passar calado; só os itens 1-3 continuam valendo.

Como rodar:

```sh
node scripts/ci/check-claude-md-integrity.mjs                          # compara com o HEAD
CLAUDE_MD_BASE=origin/main node scripts/ci/check-claude-md-integrity.mjs   # compara com a main
```

Exit 0 = passou (ou passou com `::warning::` de base não resolvida); exit 1 = possível wipe ou
`CLAUDE.md`/seção corrompidos (a mensagem diz qual arquivo e quanto encolheu, ou o que está errado no
`CLAUDE.md`).

### Limitações conhecidas (aceitas — não são bug a corrigir, são o preço de um guard sem LLM)

- **Mede volume, não substância.** Trocar o conteúdo real das 8 seções por enchimento (texto de preenchimento
  qualquer, mantendo os cabeçalhos) passa o guard, porque o item 4 só soma bytes. Isso não detecta uma
  degradação de conteúdo que preserva ou aumenta o tamanho do arquivo — só pega remoção/encolhimento líquido.
- **Rename de doc dispara falso positivo.** Se um `docs/agentes/X.md` da base for renomeado para `Y.md` no
  mesmo commit (mesmo com conteúdo preservado ou ampliado), o item 5 acusa "`X.md` existia e sumiu", porque
  o script não faz detecção de rename (`git diff -M`). Se for um rename legítimo (como aconteceu nesta
  sessão: `vercel-deploy.md` do Zapp virou `lovable-vercel.md` no Multiplixe — mas isso foi arquivo **novo**,
  não rename dentro do próprio Multiplixe, então não disparou), explique no corpo do PR e force o merge; não
  é sinal de wipe real.

Mudança legítima que encolhe muito por outro motivo (ex.: mover uma seção inteira para outro arquivo) ainda
passa pelo limiar do conjunto — se não passar, divida em dois PRs ou explique no corpo da PR.

Quando adicionar uma seção nova ao `AGENTS.md`, atualize `REQUIRED_SECTIONS` no script e a lista acima no
**mesmo PR**.
