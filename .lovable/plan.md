
Roadmap 23/23 já concluído. Proponho um novo ciclo: **Excelência+ (5 melhorias incrementais)** para elevar a plataforma além do 10/10, com foco em valor de produto, não em refatorações cosméticas.

## Próximas 5 melhorias

**E1 — Dashboard de impacto pessoal**
Widget no `/perfil` mostrando: horas estudadas (semana/mês), XP por dia (sparkline), top 3 categorias, comparação com média do departamento. Reusa `useUserXP`, `useXPHistory`, `useDepartmentLeaderboard`. Sem novas tabelas.

**E2 — Modo "Foco" no LessonPlayer**
Toggle que esconde sidebar/header, ativa Pomodoro automático e silencia notificações. Persiste preferência em `useUserPreferences`. Eleva engajamento e tempo de tela útil.

**E3 — Recomendação "Continue de onde parou" inteligente**
Refinar `ContinueLearningWidget` priorizando: (1) última aula iniciada não concluída, (2) próxima aula da trilha ativa, (3) curso favoritado sem progresso. Hoje pega só a mais recente.

**E4 — Compartilhamento social de conquistas (real)**
`ShareAchievement` hoje gera imagem mas falta integração nativa Web Share API + fallback de download. Adicionar `navigator.share` com imagem PNG gerada e copy persuasivo (LinkedIn-ready).

**E5 — Painel admin: relatório semanal por e-mail**
Edge function `weekly-admin-digest` (cron) envia para admins: novos usuários, cursos mais concluídos, alertas de queda de engajamento. Reusa `send-security-alert` como base de transporte.

## Aceite global
Cada item entrega valor mensurável sem dívida técnica. Build OK · zero regressão · testes onde fizer sentido (E3, E5).

Vou executar E1 → E5 em sequência, sem pausas, ao aprovar.
