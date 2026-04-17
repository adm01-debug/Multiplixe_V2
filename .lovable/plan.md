
Plano já aprovado anteriormente (Ondas 1-3, 23 melhorias). Item 1 (Realtime hardening) entregue. Próximo: Item 2 — Lazy images.

# Próxima execução: Item 2/23 — Lazy Images + microotimizações

## Mudanças
1. **`src/components/LazyImage.tsx`** — adicionar `loading="lazy"` e `decoding="async"` no `<img>` interno (já tem IntersectionObserver, mas reforça hint do browser)
2. **`src/components/catalog/CourseCard.tsx`** — passar `loading="lazy"` ao `LazyImage` (via prop spread)
3. **`src/components/learning-paths/LearningPathCard.tsx`** — verificar e adicionar `loading="lazy"` + `decoding="async"` em `<img>` de thumbnail
4. **`src/components/CertificateCard.tsx`** — idem para thumbnails/badges

## Item 3 (encadeado na mesma entrega): Preload de fontes
5. **`index.html`** — adicionar `<link rel="preload" as="style">` para a URL do Google Fonts e manter o `<link rel="stylesheet">` para evitar FOUT

## Critério de aceite
- Todos os `<img>` críticos com `loading="lazy"` + `decoding="async"`
- LCP melhora (fontes pré-carregadas)
- Zero regressão visual
- Build passa, tipos OK

Após esta entrega, sigo para Item 4 (Headers de segurança via meta tags) na próxima mensagem.
