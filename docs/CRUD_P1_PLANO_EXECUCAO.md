# 📅 PLANO DE EXECUÇÃO - MELHORIAS P1 MULTIPLIXE

## 🎯 Objetivo
Implementar 3 melhorias críticas (P1) no MULTIPLIXE em **2-4 horas** com qualidade enterprise.

---

## 📊 Status Geral

| Etapa | Status | Tempo Estimado | Responsável |
|-------|--------|----------------|-------------|
| 1. Preparação | ⏳ Pendente | 15 min | Dev |
| 2. Migration Banco | ⏳ Pendente | 10 min | Dev + DBA |
| 3. Copiar Hooks | ⏳ Pendente | 10 min | Dev |
| 4. Copiar Biblioteca | ⏳ Pendente | 5 min | Dev |
| 5. Copiar Componentes | ⏳ Pendente | 10 min | Dev |
| 6. Integração Admin | ⏳ Pendente | 30 min | Dev |
| 7. Integração Catálogo | ⏳ Pendente | 20 min | Dev |
| 8. Testes Unitários | ⏳ Pendente | 30 min | QA |
| 9. Testes Integrados | ⏳ Pendente | 20 min | QA |
| 10. Deploy Staging | ⏳ Pendente | 10 min | DevOps |
| 11. Validação Final | ⏳ Pendente | 20 min | Product Owner |
| 12. Deploy Produção | ⏳ Pendente | 10 min | DevOps |

**TOTAL:** 3h 10min

---

## 📅 CRONOGRAMA DETALHADO

### **🔵 FASE 1: PREPARAÇÃO (15 min)**

**Tempo:** 09:00 - 09:15

**Checklist:**
- [ ] Criar branch: `feature/crud-p1-melhorias`
- [ ] Baixar arquivos do package multiplixe-melhorias
- [ ] Revisar estrutura do projeto MULTIPLIXE
- [ ] Instalar dependências (se necessário)
- [ ] Configurar ambiente de desenvolvimento

**Comandos:**
```bash
git checkout -b feature/crud-p1-melhorias
npm install papaparse @types/papaparse
```

---

### **🟢 FASE 2: DATABASE MIGRATION (10 min)**

**Tempo:** 09:15 - 09:25

**Checklist:**
- [ ] Copiar arquivo `20241231_saved_filters.sql` para `/supabase/migrations/`
- [ ] Revisar SQL da migration
- [ ] Aplicar migration: `npx supabase db push`
- [ ] Verificar tabela criada no Dashboard Supabase
- [ ] Testar policies RLS manualmente

**Validação:**
```sql
-- Verificar tabela
SELECT * FROM saved_filters LIMIT 1;

-- Testar insert
INSERT INTO saved_filters (entity_type, name, filters)
VALUES ('test', 'Test Filter', '{"status": "active"}'::jsonb);

-- Verificar RLS
SELECT * FROM saved_filters WHERE user_id = auth.uid();
```

---

### **🟡 FASE 3: COPIAR HOOKS (10 min)**

**Tempo:** 09:25 - 09:35

**Checklist:**
- [ ] Copiar `useDebouncedValue.ts` → `/src/hooks/`
- [ ] Copiar `useBuscaFulltext.ts` → `/src/hooks/`
- [ ] Copiar `useSavedFilters.ts` → `/src/hooks/`
- [ ] Verificar imports (Supabase client path)
- [ ] Testar compilação TypeScript

**Comando:**
```bash
npm run build # ou tsc --noEmit
```

---

### **🟣 FASE 4: COPIAR BIBLIOTECA (5 min)**

**Tempo:** 09:35 - 09:40

**Checklist:**
- [ ] Copiar `csvImporter.ts` → `/src/lib/`
- [ ] Verificar import de `papaparse`
- [ ] Verificar import de `zod`
- [ ] Testar compilação TypeScript

---

### **🔴 FASE 5: COPIAR COMPONENTES (10 min)**

**Tempo:** 09:40 - 09:50

**Checklist:**
- [ ] Copiar `BuscaAvancada.tsx` → `/src/components/`
- [ ] Copiar `SavedFiltersDropdown.tsx` → `/src/components/`
- [ ] Copiar `CSVImporter.tsx` → `/src/components/`
- [ ] Verificar imports de componentes UI (shadcn)
- [ ] Testar compilação TypeScript

**Validação:**
```bash
npm run dev
# Verificar se não há erros de compilação
```

---

### **🟠 FASE 6: INTEGRAÇÃO NO ADMIN (30 min)**

**Tempo:** 09:50 - 10:20

**Arquivo:** `src/pages/Admin.tsx`

**Checklist:**
- [ ] Importar componentes e hooks
- [ ] Criar schema Zod para cursos
- [ ] Adicionar BuscaAvancada no header
- [ ] Adicionar SavedFiltersDropdown
- [ ] Criar Dialog de Import CSV
- [ ] Conectar busca com hook useBuscaFulltext
- [ ] Implementar lógica de aplicação de filtros
- [ ] Implementar lógica de import
- [ ] Testar no navegador

**Schema de exemplo:**
```typescript
const cursoSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  instructor: z.string().min(1, 'Instrutor obrigatório'),
  duration: z.coerce.number().positive('Duração positiva'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().optional(),
});
```

---

### **🟤 FASE 7: INTEGRAÇÃO NO CATÁLOGO (20 min)**

**Tempo:** 10:20 - 10:40

**Arquivo:** `src/pages/Catalog.tsx`

**Checklist:**
- [ ] Importar BuscaAvancada e SavedFiltersDropdown
- [ ] Importar hook useBuscaFulltext
- [ ] Adicionar barra de ferramentas
- [ ] Conectar busca com dados
- [ ] Conectar filtros salvos
- [ ] Testar busca em tempo real
- [ ] Testar aplicação de filtros

---

### **⚪ FASE 8: TESTES UNITÁRIOS (30 min)**

**Tempo:** 10:40 - 11:10

**Checklist:**

#### **Busca Fulltext:**
- [ ] Busca com 1 caractere (não deve buscar)
- [ ] Busca com 2+ caracteres (deve buscar)
- [ ] Debounce de 300ms funciona
- [ ] Loading indicator aparece
- [ ] Clear button funciona
- [ ] Busca em múltiplas colunas

#### **Filtros Salvos:**
- [ ] Salvar filtro com nome único
- [ ] Salvar filtro duplicado (deve dar erro)
- [ ] Aplicar filtro salvo
- [ ] Definir como padrão (⭐)
- [ ] Duplicar filtro
- [ ] Deletar filtro
- [ ] Filtro público aparece para outros
- [ ] Filtro privado não aparece para outros

#### **Import CSV:**
- [ ] Upload arquivo válido
- [ ] Upload arquivo com erros
- [ ] Validação Zod funciona
- [ ] Preview dados válidos
- [ ] Lista de erros aparece
- [ ] Template download funciona
- [ ] Import em massa funciona
- [ ] Progress bar aparece

---

### **⚫ FASE 9: TESTES INTEGRADOS (20 min)**

**Tempo:** 11:10 - 11:30

**Cenários:**

#### **Cenário 1: Workflow Completo de Busca**
1. Abrir catálogo
2. Digitar "React" na busca
3. Verificar resultados
4. Aplicar filtro "Nível: Iniciante"
5. Salvar filtro como "React Iniciante"
6. Limpar busca
7. Aplicar filtro salvo
8. Verificar resultados

#### **Cenário 2: Workflow Completo de Import**
1. Abrir Admin → Cursos
2. Clicar "Importar CSV"
3. Baixar template
4. Preencher template com 5 cursos
5. Upload do arquivo
6. Verificar validação
7. Confirmar importação
8. Verificar cursos na lista

#### **Cenário 3: Workflow de Filtros Salvos**
1. Criar filtro complexo (categoria + nível + status)
2. Salvar como "Cursos Tech Avançados"
3. Marcar como padrão
4. Fechar e reabrir página
5. Verificar filtro aplicado automaticamente
6. Duplicar filtro
7. Renomear duplicata
8. Deletar filtro original

---

### **🟦 FASE 10: DEPLOY STAGING (10 min)**

**Tempo:** 11:30 - 11:40

**Checklist:**
- [ ] Commit changes: `git commit -m "feat: implement P1 CRUD improvements"`
- [ ] Push para staging: `git push origin feature/crud-p1-melhorias`
- [ ] Criar Pull Request
- [ ] Deploy automático para staging (se configurado)
- [ ] Verificar logs de deploy
- [ ] Testar em staging

**Comandos:**
```bash
git add .
git commit -m "feat: implement P1 CRUD improvements - search, filters, import"
git push origin feature/crud-p1-melhorias
```

---

### **🟧 FASE 11: VALIDAÇÃO FINAL (20 min)**

**Tempo:** 11:40 - 12:00

**Product Owner / Stakeholder Validation:**

**Checklist de Aceitação:**
- [ ] Busca fulltext funciona conforme especificado
- [ ] Filtros salvos funcionam conforme especificado
- [ ] Import CSV funciona conforme especificado
- [ ] UX está fluida e intuitiva
- [ ] Não há bugs visuais
- [ ] Performance está aceitável (< 2s)
- [ ] Mobile responsive funciona
- [ ] Documentação está completa

**Critérios de Rejeição:**
- ❌ Erros no console
- ❌ Bugs críticos
- ❌ Performance ruim (> 5s)
- ❌ UX confusa
- ❌ Funcionalidades faltando

---

### **🟨 FASE 12: DEPLOY PRODUÇÃO (10 min)**

**Tempo:** 12:00 - 12:10

**Pré-requisitos:**
- ✅ Validação PO aprovada
- ✅ Testes passando
- ✅ Code review aprovado
- ✅ Documentação atualizada

**Checklist:**
- [ ] Merge PR para `main`
- [ ] Tag release: `git tag -a v1.1.0 -m "P1 CRUD improvements"`
- [ ] Deploy para produção
- [ ] Aplicar migration em produção
- [ ] Verificar logs de produção
- [ ] Monitorar métricas (5 min)
- [ ] Notificar time de sucesso

**Comandos:**
```bash
git checkout main
git merge feature/crud-p1-melhorias
git tag -a v1.1.0 -m "Release: P1 CRUD improvements"
git push origin main --tags
```

---

## 📊 MÉTRICAS DE MONITORAMENTO

Após deploy, monitorar por 24h:

| Métrica | Baseline | Meta | Crítico |
|---------|----------|------|---------|
| Tempo de busca | - | < 500ms | > 2s |
| Taxa de erro import | - | < 5% | > 15% |
| Uso de filtros salvos | 0% | > 30% | < 10% |
| Erros no Sentry | 0 | 0 | > 5 |
| Tempo de carregamento | - | < 2s | > 5s |

---

## 🚨 PLANO DE ROLLBACK

Se houver problemas críticos em produção:

### **Opção 1: Rollback Completo**
```bash
git revert HEAD
git push origin main
# Reverter migration
npx supabase db reset --linked
```

### **Opção 2: Feature Flag**
```typescript
// Desabilitar features temporariamente
const ENABLE_P1_FEATURES = false;

{ENABLE_P1_FEATURES && (
  <BuscaAvancada ... />
)}
```

### **Opção 3: Hotfix**
```bash
git checkout -b hotfix/p1-critical-fix
# Fix crítico
git push origin hotfix/p1-critical-fix
# Fast-track para produção
```

---

## ✅ CRITÉRIOS DE SUCESSO FINAL

- ✅ **Técnico:** Todas as funcionalidades implementadas e testadas
- ✅ **Negócio:** PO aprovou e usuários estão satisfeitos
- ✅ **Performance:** Métricas dentro da meta
- ✅ **Qualidade:** Zero bugs críticos em produção
- ✅ **Documentação:** README e exemplos completos
- ✅ **Adoção:** > 30% dos usuários usando filtros salvos na primeira semana

---

## 📞 CONTATOS

- **Dev Lead:** [Nome]
- **Product Owner:** [Nome]
- **QA Lead:** [Nome]
- **DevOps:** [Nome]

---

**Status:** ⏳ PRONTO PARA EXECUÇÃO

**Início Planejado:** [Data/Hora]

**Fim Estimado:** [Data/Hora + 3h10min]

**Aprovado por:** __________________

**Data:** 31/12/2024
