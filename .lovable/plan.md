
Vou executar a auditoria técnica exaustiva do sistema. Primeiro, preciso coletar contexto real do código antes de apresentar o relatório completo. Como esta é uma análise extensa, apresento o plano de entrega da auditoria.

# Auditoria Técnica Exaustiva — Plataforma Promo Brindes Learning

## Escopo
Análise completa das 20 dimensões aplicáveis (excluo CI/CD e Infraestrutura/DevOps por estarem fora do controle direto da plataforma Lovable — registrarei como "NÃO AUDITÁVEL"), com scorecard, roadmap em 3 ondas e Top 10 ações por ROI.

## Método
1. **Coleta de contexto real** (Fase 0):
   - Inventário: arquivos `src/`, hooks, edge functions, migrations, testes
   - Schema DB via `supabase--read_query` (tabelas, RLS, índices)
   - Linter Supabase (`supabase--linter`) para issues automatizadas
   - Scan de segurança (`security--run_security_scan`)
   - Análise de `package.json`, `tsconfig`, `vite.config.ts`
   - Grep por anti-padrões: `any`, `console.`, `dangerouslySetInnerHTML`, secrets

2. **Avaliação por dimensão** com:
   - Nota 0–10 baseada em evidência concreta (arquivo:linha)
   - Gaps específicos para 10/10
   - Ações corretivas (código/migration/config)

3. **Scorecard ponderado**:
   - Peso ×3: Segurança, Auth, Authz, Data Integrity
   - Peso ×2: DB, Tipagem, Validação, Testes, Arquitetura
   - Peso ×1: demais

4. **Plano de ação**:
   - Top 10 por ROI (impacto ÷ esforço)
   - 3 ondas: Quick Wins (1-3d) · Sprint 1 (1-2sem) · Sprint 2 (2-4sem)

## Entrega
Relatório único estruturado em:
- Inventário do Sistema
- 20 Dimensões analisadas (cada uma: nota, evidências citadas, gaps, ações)
- Scorecard visual ASCII
- Top 10 ações
- Roadmap 3 ondas
- Nota final ponderada + comentário de maturidade

## Após aprovação
Executo a auditoria completa em uma única resposta extensa e estruturada (sem implementar correções nesta etapa — o objetivo é o diagnóstico). Em seguida, aguardo seu OK para iniciar a execução das ações priorizadas em sprints (mantendo o padrão "1 melhoria por vez até 10/10").
