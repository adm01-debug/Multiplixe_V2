# 💾 BACKUP E DISASTER RECOVERY STRATEGY
## Sistema de Notificações

---

## 📋 OVERVIEW

Este documento define a estratégia completa de backup, recovery e disaster recovery para o sistema de notificações.

**RPO (Recovery Point Objective):** < 1 hora  
**RTO (Recovery Time Objective):** < 2 horas  

---

## 🔄 BACKUP AUTOMÁTICO

### 1. DATABASE (Supabase/PostgreSQL)

#### Backup Diário (Full)
```bash
#!/bin/bash
# Script: backup-database.sh
# Executar via cron: 0 2 * * * /scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
S3_BUCKET="s3://promobrindes-backups/notifications/database"

# Backup full do database
pg_dump \
  --host=db.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=notifications \
  --format=custom \
  --file="${BACKUP_DIR}/full_${DATE}.dump"

# Comprimir
gzip "${BACKUP_DIR}/full_${DATE}.dump"

# Upload para S3
aws s3 cp \
  "${BACKUP_DIR}/full_${DATE}.dump.gz" \
  "${S3_BUCKET}/full/"

# Manter apenas últimos 30 dias localmente
find "${BACKUP_DIR}" -name "full_*.dump.gz" -mtime +30 -delete

# Verificar integridade
pg_restore --list "${BACKUP_DIR}/full_${DATE}.dump.gz" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backup verified successfully"
else
  echo "❌ Backup verification failed"
  # Alertar Slack/PagerDuty
  curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"🚨 Database backup failed\"}"
fi
```

#### Backup Incremental (Continuous)
```bash
# Configurar WAL archiving no PostgreSQL
# postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://promobrindes-backups/notifications/wal/%f'
archive_timeout = 300  # 5 minutos

# Permite PITR (Point-In-Time Recovery)
```

### 2. REDIS (Cache e Queue)

#### Backup Diário
```bash
#!/bin/bash
# Script: backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"
S3_BUCKET="s3://promobrindes-backups/notifications/redis"

# Trigger BGSAVE
redis-cli BGSAVE

# Aguardar conclusão
while [ $(redis-cli LASTSAVE) -eq $LAST_SAVE ]; do
  sleep 1
done

# Copiar RDB file
cp /var/lib/redis/dump.rdb "${BACKUP_DIR}/dump_${DATE}.rdb"

# Upload para S3
aws s3 cp \
  "${BACKUP_DIR}/dump_${DATE}.rdb" \
  "${S3_BUCKET}/"

# Cleanup
find "${BACKUP_DIR}" -name "dump_*.rdb" -mtime +7 -delete
```

### 3. ARQUIVOS E LOGS

#### Backup Semanal
```bash
#!/bin/bash
# Script: backup-files.sh
# Executar: 0 3 * * 0 /scripts/backup-files.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/files"
S3_BUCKET="s3://promobrindes-backups/notifications/files"

# Arquivos de configuração
tar -czf "${BACKUP_DIR}/config_${DATE}.tar.gz" \
  /app/config \
  /app/.env.production \
  /app/docker-compose.yml

# Logs
tar -czf "${BACKUP_DIR}/logs_${DATE}.tar.gz" \
  /app/logs \
  --exclude='*.tmp'

# Upload
aws s3 sync "${BACKUP_DIR}" "${S3_BUCKET}/"

# Cleanup (90 dias)
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +90 -delete
```

---

## 🔧 PROCEDIMENTOS DE RECOVERY

### 1. Database Recovery

#### Restore Full Backup
```bash
#!/bin/bash
# Script: restore-database.sh
# Uso: ./restore-database.sh <backup_file>

BACKUP_FILE=$1

# Download do S3 se necessário
if [[ $BACKUP_FILE == s3://* ]]; then
  aws s3 cp "$BACKUP_FILE" /tmp/backup.dump.gz
  BACKUP_FILE="/tmp/backup.dump.gz"
fi

# Descomprimir
gunzip -c "$BACKUP_FILE" > /tmp/backup.dump

# Restore
pg_restore \
  --host=db.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=notifications \
  --clean \
  --if-exists \
  /tmp/backup.dump

echo "✅ Database restored successfully"
```

#### Point-In-Time Recovery (PITR)
```bash
#!/bin/bash
# Script: restore-pitr.sh
# Uso: ./restore-pitr.sh "2026-01-02 14:30:00"

TARGET_TIME=$1

# 1. Restore base backup
./restore-database.sh s3://promobrindes-backups/notifications/database/full/latest.dump.gz

# 2. Configurar recovery
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'aws s3 cp s3://promobrindes-backups/notifications/wal/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# 3. Restart PostgreSQL
systemctl restart postgresql

echo "✅ PITR restore completed to $TARGET_TIME"
```

### 2. Redis Recovery
```bash
#!/bin/bash
# Script: restore-redis.sh

# 1. Stop Redis
systemctl stop redis

# 2. Download backup
aws s3 cp \
  s3://promobrindes-backups/notifications/redis/dump_latest.rdb \
  /var/lib/redis/dump.rdb

# 3. Fix permissions
chown redis:redis /var/lib/redis/dump.rdb

# 4. Start Redis
systemctl start redis

echo "✅ Redis restored successfully"
```

---

## 🚨 DISASTER RECOVERY PLAN

### Cenário 1: Perda Total do Database

**Tempo estimado:** 30-60 minutos

```bash
#!/bin/bash
# DR Plan - Database Loss

# 1. Provisionar novo database
echo "1. Provisioning new database..."
# (Supabase auto-provision ou Terraform)

# 2. Restore último backup
echo "2. Restoring latest backup..."
./restore-database.sh s3://promobrindes-backups/notifications/database/full/latest.dump.gz

# 3. Aplicar WAL logs (PITR)
echo "3. Applying WAL logs..."
./restore-pitr.sh "now"

# 4. Validar dados
echo "4. Validating data..."
psql -c "SELECT COUNT(*) FROM notifications;"

# 5. Atualizar connection strings
echo "5. Updating connection strings..."
kubectl set env deployment/notifications \
  DATABASE_URL=postgresql://new-db-url

# 6. Restart aplicação
echo "6. Restarting application..."
kubectl rollout restart deployment/notifications

# 7. Verificar health
echo "7. Checking health..."
curl -f http://notifications.promobrindes.com.br/health
```

### Cenário 2: Perda da Região AWS

**Tempo estimado:** 2-4 horas

**Pré-requisitos:**
- Backups replicados em múltiplas regiões
- DNS configurado para failover
- Infraestrutura IaC (Terraform) pronta

**Steps:**
1. ✅ Ativar região secundária (us-east-1)
2. ✅ Restore backups na nova região
3. ✅ Deploy aplicação via Terraform
4. ✅ Update DNS para apontar para nova região
5. ✅ Validar todos os serviços
6. ✅ Comunicar stakeholders

### Cenário 3: Corrupção de Dados

**Tempo estimado:** 1-2 horas

```sql
-- Identificar ponto de corrupção
SELECT 
  created_at,
  COUNT(*) 
FROM notifications 
GROUP BY DATE(created_at) 
ORDER BY created_at DESC;

-- Restore PITR para antes da corrupção
-- Executar: ./restore-pitr.sh "2026-01-02 13:00:00"

-- Validar integridade
SELECT COUNT(*) FROM notifications WHERE is_read IS NULL;
```

---

## 📊 TESTES DE RECOVERY

### Teste Mensal (Obrigatório)

```bash
#!/bin/bash
# Script: test-recovery.sh
# Executar: 1º domingo de cada mês

# 1. Criar namespace de teste
kubectl create namespace notifications-dr-test

# 2. Restore backup em ambiente de teste
./restore-database.sh \
  s3://promobrindes-backups/notifications/database/full/latest.dump.gz \
  --target=test

# 3. Validar dados
npm run test:recovery

# 4. Medir tempo de recovery
echo "Recovery Time: $(cat /tmp/recovery-time.txt)"

# 5. Cleanup
kubectl delete namespace notifications-dr-test

# 6. Documentar resultado
echo "✅ DR test completed on $(date)" >> /logs/dr-tests.log
```

### Checklist de Validação
- [ ] Todos os serviços online
- [ ] Database accessível
- [ ] Dados consistentes
- [ ] APIs funcionando
- [ ] Notificações sendo enviadas
- [ ] Logs sendo gravados
- [ ] Métricas disponíveis
- [ ] Alertas funcionando

---

## 🔐 BACKUP SECURITY

### Encryption at Rest
```bash
# Encriptar backups antes de upload
openssl enc -aes-256-cbc \
  -in backup.dump \
  -out backup.dump.enc \
  -pass file:/secrets/backup-key

# Upload apenas versão encriptada
aws s3 cp backup.dump.enc s3://bucket/
```

### Access Control
```yaml
# IAM Policy - Apenas leitura para recovery
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::promobrindes-backups/notifications/*"
      ]
    }
  ]
}
```

---

## 📈 MONITORING

### Alertas de Backup
```yaml
# Prometheus Alert Rules
groups:
  - name: backup_alerts
    rules:
      - alert: BackupFailed
        expr: backup_success == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Backup failed for {{ $labels.job }}"
      
      - alert: BackupNotRunning
        expr: time() - backup_last_success_timestamp > 86400
        labels:
          severity: warning
        annotations:
          summary: "No backup in last 24 hours"
```

---

## 📝 RUNBOOK

### 1. Backup Manual (Emergência)
```bash
# Executar backup imediato
/scripts/backup-database.sh
/scripts/backup-redis.sh
/scripts/backup-files.sh
```

### 2. Verificar Status de Backups
```bash
# Listar backups recentes
aws s3 ls s3://promobrindes-backups/notifications/database/full/ \
  --recursive \
  --human-readable \
  --summarize

# Verificar último backup
aws s3 ls s3://promobrindes-backups/notifications/database/full/ \
  | tail -1
```

### 3. Contactos de Emergência
- **Infra Lead:** +55 11 99999-9999
- **DBA:** +55 11 88888-8888
- **On-Call:** Slack #incident-response

---

**Última atualização:** 02/01/2026  
**Próxima revisão:** 01/02/2026  
**Responsável:** Equipe DevOps
