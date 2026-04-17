
Próximo item da fila: #4 — Headers de segurança via meta tags no `index.html` (CSP via meta não é ideal, melhor usar X-Content-Type-Options, Referrer-Policy, Permissions-Policy que funcionam via meta).

# Item 4/23 — Security Headers (meta tags)

## Mudanças em `index.html`
Adicionar no `<head>`:
- `<meta http-equiv="X-Content-Type-Options" content="nosniff">`
- `<meta name="referrer" content="strict-origin-when-cross-origin">`
- `<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), interest-cohort=()">`

Nota: `X-Frame-Options`, `HSTS` e `CSP` completo precisam de headers HTTP reais (servidor) — não funcionam via meta tag de forma confiável. Lovable hospeda o deploy e gerencia esses headers no nível do edge. Documentarei isso no runbook (item #12).

## Critério de aceite
- Meta tags presentes no `<head>` antes de qualquer `<script>`
- Zero quebra de funcionalidade
- Build passa

Após esta entrega, sigo para Item 5 (MFA funcional) na próxima mensagem.
