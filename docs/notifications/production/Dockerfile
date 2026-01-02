# 🐳 DOCKERFILE - SISTEMA DE NOTIFICAÇÕES
# Multi-stage build para otimização

# ========================================
# STAGE 1: Build
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Remover dev dependencies
RUN npm prune --production

# ========================================
# STAGE 2: Runtime
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Adicionar user não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 notifuser

# Copiar apenas o necessário do builder
COPY --from=builder --chown=notifuser:nodejs /app/dist ./dist
COPY --from=builder --chown=notifuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=notifuser:nodejs /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expor porta
EXPOSE 3000

# Mudar para user não-root
USER notifuser

# Comando de inicialização
CMD ["node", "dist/index.js"]
