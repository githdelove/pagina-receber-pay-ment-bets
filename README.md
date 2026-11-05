# PIX R$ 15 – relatório completo (BravoPay)

Cloudflare Pages + Functions. Sem dependências, sem build.

## Publicar
1. Suba esta pasta num repositório GitHub e conecte no Cloudflare Pages
   (build command: vazio · output directory: `public`).
   Ou: `npx wrangler pages deploy public --project-name pix-relatorio`
2. Em Settings > Variables and Secrets, crie:
   - `BRAVOPAY_KEY`   (secret) sua chave da BravoPay
   - `REPORT_URL`     link do relatório que será liberado após o pagamento
   - `WEBHOOK_SECRET` um texto aleatório qualquer (opcional, recomendado)
3. No painel da BravoPay, cadastre o webhook:
   `https://SEU-SITE.pages.dev/api/webhook?secret=SEU_WEBHOOK_SECRET`

## Rotas
- POST /api/create   cria a cobrança de R$ 15,00 (valor fixo no servidor)
- GET  /api/status   confirma o pagamento direto na BravoPay
- POST /api/webhook  recebe aviso da BravoPay e reconfirma via GET
- GET  /api/report   libera o relatório só se o pagamento estiver confirmado
