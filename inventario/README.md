# inventario/ — estado real do projeto, gerado por script

Pasta de **dados gerados**, não de relatório escrito à mão. É a primeira coisa que um agente lê:
responde "o que existe hoje" sem varrer os 470 arquivos do repo. Se um número aqui divergir do que
você mediu, **regere o arquivo** (comandos abaixo) em vez de corrigir à mão.

```sh
npm run inventario        # refaz tudo (estado/ + ia/)
npm run inventario:check  # exit 1 se algum arquivo commitado está desatualizado
npm run guards            # roda os testes dos geradores (node --test scripts/ci/*.unit.mjs)
```

## `inventario/estado/` — o que existe

| Arquivo | Gerado por | O que tem |
|---|---|---|
| `rotas.json` | `node scripts/inventario/gerar-rotas.mjs` | cada rota de `src/App.tsx` (arquivo, protegida, só admin, `routeName`), **por onde o usuário chega nela** (paleta de comandos, menu mobile, atalho de teclado, prefetch, `navigate()`/`<Link>` no código) e, seguindo os imports da página, os hooks, tabelas, RPCs, buckets e edge functions que aquela tela realmente toca. Mais `problemas`: rota sem arquivo, rota protegida sem nenhuma entrada na UI, entrada de UI apontando para rota que não existe, import quebrado |
| `edges.json` | `node scripts/inventario/gerar-repo.mjs` | cada edge function de `supabase/functions/`: linhas, segredos lidos (`Deno.env.get`), tabelas e RPCs que usa, e **quem a invoca** (src, migrations, outras edges, `config.toml`). `sem_chamador` = código morto em produção |
| `schema-declarado.json` | `node scripts/inventario/gerar-schema.mjs` | o schema que o **repositório declara**: `types.ts` (tabelas, colunas, views, funções, enums) cruzado com o replay de `supabase/migrations/` (RLS, policies, triggers, índices, cron, buckets, `SECURITY DEFINER`/`search_path`) e com `.from()`/`.rpc()` do código. Inclui `drift` (o que está numa fonte e não na outra) e `alertas` |
| `banco.json` | `SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs` **ou** rodar `scripts/inventario/banco.sql` no SQL Editor do Lovable Cloud e `node scripts/inventario/gerar-banco.mjs --entrada <arquivo>` | o **banco ao vivo**, só leitura: por tabela RLS/policies/triggers/índices/linhas/bytes/citada no banco, funções com `SECURITY DEFINER` sem `search_path`, cada cron job (agenda, falhas em 24 h/7 d, horas paradas), edge functions publicadas × pastas do repo, tabelas órfãs e `alertas`. **Não é versionado**: só existe depois de uma consulta de verdade |

## `inventario/ia/` — mapa do código

Gerado por `node scripts/ai-context/gerar.mjs`. Comece pelo `INDEX.md`: ele resume tudo acima em um
documento e diz qual JSON responde cada pergunta.

| Arquivo | O que tem |
|---|---|
| `INDEX.md` | o documento que o agente lê primeiro: números, dívida medida, tabela de rotas, tabela de edges, alertas de banco, cron, ciclos de import, hubs, arquivos mais mexidos em 90 dias, scripts npm |
| `componentes.json` | componente → exports, linhas, hooks, tabelas, edges, quem usa, órfão; e nomes duplicados |
| `hooks.json` | hook → arquivo, tabelas/RPCs/edges que toca, quem usa, se tem teste |
| `grafo.json` | grafo de imports: hubs, ciclos, órfãos, arestas por arquivo |
| `baseline.json` | contagens, dívida (`any`, `console.log`, `@ts-ignore`, TODO), maiores arquivos, env usada × declarada, git (últimos commits, mais mexidos em 90 d), alertas |
| `manifest.json` | sha256 de cada arquivo acima + commit + `gerado_em`. **É o único arquivo com data** |

## O que estes arquivos NÃO provam

- **`schema-declarado.json` não é o banco ao vivo.** `types.ts` é a foto do instante em que o Lovable
  o gerou, e o replay das migrations é o que o repo *pediu*. O Lovable também aplica DDL direto pelo
  painel, sem gerar migration — foi o que aconteceu com `user_roles`, que está no `types.ts` e não é
  criada por nenhuma migration do repo (aparece em `drift.referenciadas_sem_create`). Quem resolve
  divergência é `banco.json`.
- **`alertas` de `tabela_sem_uso_no_codigo` não é prova de que pode apagar.** A tabela pode ser usada
  por RPC com outro nome, por trigger ou por sistema externo.
- **`EXECUTE format(...)`** nas migrations não é rastreado pelo replay (fica em `ddl_dinamico`).
- **`.from(variavel)`** só é resolvido quando a variável é constante de string no mesmo arquivo.

## Como o inventário se mantém

Determinismo é o contrato: **o mesmo código gera os mesmos bytes** (só `manifest.json` tem data). Por
isso `--check` funciona como guarda — se alguém mexeu em rota, edge ou migration e não regerou, o
comando acusa.

Quem mantém isto em dia é `.github/workflows/inventario-estado-semanal.yml`: toda segunda regera tudo e
abre PR **só se o conteúdo mudou** (carimbo de data e telemetria de 7 dias não contam —
`scripts/inventario/mudou-conteudo.mjs`). O frescor **não** é cobrado no check de PR de propósito: o
Lovable commita direto na `main` a cada edição de tela e `rotas.json` muda junto com qualquer import, o
que deixaria a `main` vermelha quase sempre. Para cobrar à mão antes de uma PR:
`npm run inventario:check` ou `INVENTARIO_CHECK=1 npm run guards`.
