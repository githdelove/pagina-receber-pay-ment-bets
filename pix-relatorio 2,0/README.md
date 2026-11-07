# PIX R$ 15 – relatório completo (BravoPay)

Cloudflare Pages + Functions. Sem dependências, sem build.

## Publicar
1. Suba esta pasta num repositório GitHub e conecte no Cloudflare Pages
   (build command: vazio · output directory: `public`).
   Ou: `npx wrangler pages deploy public --project-name pix-relatorio`
2. Em Settings > Variables and Secrets, crie:
   - `BRAVOPAY_KEY`   (secret) sua chave da BravoPay
   - `WEBHOOK_SECRET` um texto aleatório qualquer (opcional, recomendado)
3. No painel da BravoPay, cadastre o webhook:
   `https://SEU-SITE.pages.dev/api/webhook?secret=SEU_WEBHOOK_SECRET`

## Onde colocar a chave e mudar o valor
Tudo em `functions/_lib.js`, no topo:
- `VALOR_CENTAVOS`  valor da cobrança em centavos (1500 = R$ 15,00)
- `CHAVE_PADRAO`    sua chave da BravoPay (hoje é uma chave FAKE)
Se existir a variável `BRAVOPAY_KEY` no Cloudflare, ela tem prioridade sobre
a chave do código. Com repositório público, prefira só a variável do Cloudflare.

## Rotas
- POST /api/create   cria a cobrança de R$ 15,00 (valor fixo no servidor)
- GET  /api/status   confirma o pagamento direto na BravoPay
- POST /api/webhook  recebe aviso da BravoPay e reconfirma via GET
- GET  /api/report   devolve a lista de fornecedores só se o pagamento estiver confirmado

## Sua lista
Edite `functions/_dados/fornecedores.js` (nome e valor de cada fornecedor).
Não coloque a lista em `public/` nem no index.html. Use repositório PRIVADO
ou publique com `wrangler pages deploy`, para a lista não ficar visível.
