#!/bin/bash

# 🔍 SCRIPT DE VALIDAÇÃO PRÉ-PRODUÇÃO
# Sistema de Notificações - Checklist Automatizado
# Execute antes de fazer deploy em produção!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VALIDAÇÃO PRÉ-PRODUÇÃO - SISTEMA DE NOTIFICAÇÕES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

# ═══════════════════════════════════════════════════════════
# 1. SECRETS E VARIÁVEIS DE AMBIENTE
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  VALIDANDO SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se secrets estão configurados
SECRETS=(
  "RESEND_API_KEY"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "TWILIO_WHATSAPP_NUMBER"
)

for secret in "${SECRETS[@]}"; do
  if npx supabase secrets list | grep -q "$secret"; then
    check_pass "$secret configurado"
  else
    check_fail "$secret NÃO configurado"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════
# 2. ESTRUTURA DO BANCO DE DADOS
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  VALIDANDO BANCO DE DADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar tabelas existem
TABLES=(
  "notifications"
  "notification_preferences"
  "notification_templates"
  "webhook_configs"
  "webhook_logs"
)

for table in "${TABLES[@]}"; do
  if npx supabase db execute "SELECT 1 FROM $table LIMIT 1" &>/dev/null; then
    check_pass "Tabela $table existe"
  else
    check_fail "Tabela $table NÃO existe - Execute migrations!"
  fi
done

echo ""

# Verificar RLS habilitado
echo "Verificando Row Level Security..."
if npx supabase db execute "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications'" | grep -q "[1-9]"; then
  check_pass "RLS policies configuradas em notifications"
else
  check_fail "RLS policies FALTANDO em notifications"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 3. EDGE FUNCTIONS
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  VALIDANDO EDGE FUNCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FUNCTIONS=(
  "send-notification"
  "process-queue"
  "send-digest"
)

for func in "${FUNCTIONS[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    check_pass "Function $func existe"
    
    # Verificar se foi deployada
    if npx supabase functions list | grep -q "$func"; then
      check_pass "Function $func deployada"
    else
      check_warn "Function $func NÃO deployada"
    fi
  else
    check_fail "Function $func arquivo NÃO encontrado"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════
# 4. TESTES DE CONECTIVIDADE
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  TESTANDO CONECTIVIDADE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Teste Supabase
if curl -s -o /dev/null -w "%{http_code}" "$(npx supabase status | grep 'API URL' | awk '{print $3}')/health" | grep -q "200"; then
  check_pass "Supabase acessível"
else
  check_fail "Supabase INACESSÍVEL"
fi

# Teste Resend (se API key configurada)
if [ ! -z "$RESEND_API_KEY" ]; then
  if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $RESEND_API_KEY" "https://api.resend.com/domains" | grep -q "200"; then
    check_pass "Resend API funcionando"
  else
    check_fail "Resend API falhou - Verificar API key"
  fi
fi

# Teste Twilio (se credenciais configuradas)
if [ ! -z "$TWILIO_ACCOUNT_SID" ] && [ ! -z "$TWILIO_AUTH_TOKEN" ]; then
  if curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" | grep -q "account_sid"; then
    check_pass "Twilio API funcionando"
  else
    check_fail "Twilio API falhou - Verificar credenciais"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 5. ARQUIVOS FRONTEND
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  VALIDANDO ARQUIVOS FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_FILES=(
  "src/hooks/useNotifications.ts"
  "src/hooks/useNotificationPreferences.ts"
  "src/components/NotificationCenter.tsx"
  "src/components/NotificationPreferences.tsx"
  "src/lib/notifications.ts"
)

for file in "${FRONTEND_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_pass "$file existe"
    
    # Verificar se não tem mocks
    if grep -q "mockData\|fakeData\|TODO" "$file"; then
      check_warn "$file contém código de desenvolvimento (mock/TODO)"
    fi
  else
    check_fail "$file NÃO encontrado"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════
# 6. SEGURANÇA
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  VALIDANDO SEGURANÇA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se não há credenciais hardcoded
echo "Procurando credenciais hardcoded no código..."
if git grep -E "api_key|API_KEY|password|PASSWORD|secret|SECRET" --cached | grep -v ".env" | grep -v "node_modules" | grep -q .; then
  check_warn "Possíveis credenciais hardcoded encontradas - REVISAR MANUALMENTE"
else
  check_pass "Nenhuma credencial hardcoded detectada"
fi

# Verificar .env.example existe
if [ -f ".env.example" ]; then
  check_pass ".env.example existe"
else
  check_warn ".env.example NÃO existe - Criar para documentação"
fi

# Verificar .gitignore tem .env
if grep -q "^.env$" .gitignore; then
  check_pass ".env no .gitignore"
else
  check_fail ".env NÃO está no .gitignore"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 7. DOCUMENTAÇÃO
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  VALIDANDO DOCUMENTAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DOCS=(
  "README.md"
  "docs/notifications/QUICK_START.md"
  "docs/notifications/MIGRATION_MOCK_TO_PROD.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc existe"
  else
    check_warn "$doc NÃO existe"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ SISTEMA 100% PRONTO PARA PRODUÇÃO!${NC}"
  echo ""
  echo "🚀 Próximos passos:"
  echo "   1. Executar testes end-to-end"
  echo "   2. Fazer deploy em staging"
  echo "   3. Testar com usuários reais"
  echo "   4. Deploy em produção"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SISTEMA QUASE PRONTO (${WARNINGS} avisos)${NC}"
  echo ""
  echo "Avisos encontrados: $WARNINGS"
  echo "Revise os avisos acima antes de prosseguir."
  echo ""
  echo "Pode prosseguir com cautela para staging."
  exit 0
else
  echo -e "${RED}❌ SISTEMA NÃO ESTÁ PRONTO PARA PRODUÇÃO${NC}"
  echo ""
  echo "Erros críticos: $ERRORS"
  echo "Avisos: $WARNINGS"
  echo ""
  echo "CORRIJA OS ERROS antes de fazer deploy!"
  exit 1
fi
