
E4/E5 — Compartilhamento social real de conquistas via Web Share API.

## Mudanças

**1. `src/components/share/ShareAchievement.tsx`** — refinar fluxo:
- Gerar imagem PNG da conquista (canvas já existente ou via html2canvas se aplicável).
- Detectar suporte a `navigator.canShare({ files })`:
  - **Suportado**: `navigator.share()` com `files: [pngFile]`, `title`, `text` persuasivo (LinkedIn-ready) e `url` para perfil/conquista.
  - **Fallback**: download automático do PNG + `navigator.clipboard.writeText()` com texto pronto + toast informativo.
- Botões secundários permanecem: copiar link, copiar texto, baixar imagem.

**2. Copy persuasivo** — template em PT-BR otimizado para LinkedIn:
> "🏆 Acabei de conquistar [nome] na Promo Brindes Academy! +[XP] XP somados à minha jornada de aprendizado contínuo. #vendas #aprendizadocontinuo #promobrindes"

**3. Telemetria** — registrar eventos `share_attempt`, `share_success`, `share_fallback` via `useTelemetry` para medir adoção real.

**4. Acessibilidade** — botão principal com `aria-label` claro ("Compartilhar conquista X"), feedback via `LiveAnnouncer` ao concluir.

**5. Teste manual** — validar em mobile (iOS/Android share sheet) e desktop (fallback download + clipboard).

## Aceite
Web Share nativo dispara em mobile · fallback elegante em desktop · copy LinkedIn-ready · telemetria registrada · zero regressão · sem novas dependências pesadas.

Depois: E5 — Edge function `weekly-admin-digest` (cron + relatório por e-mail).
