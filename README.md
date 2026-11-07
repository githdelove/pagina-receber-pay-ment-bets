# PIX R$ 15 – relatório completo (BravoPay)

Cloudflare Workers ou Pages Functions. Sem dependências de build.

## Configuração obrigatória da BravoPay

A chave não fica mais embutida no código. Configure-a como Secret no painel do Cloudflare:

- **Worker:** Settings → Variables and Secrets → Add → Secret; nome `BRAVOPAY_KEY`, valor sua chave real.
- **Pages:** Settings → Variables and Secrets → Add variable → Encrypt; nome `BRAVOPAY_KEY`, valor sua chave real.

Depois de salvar, faça novo deploy. Sem essa configuração, a criação da cobrança responde com erro de configuração (503). Não compartilhe nem publique a chave.

## Publicar como Worker

O arquivo `worker.js` + `wrangler.jsonc` fazem o projeto funcionar como Worker (endereço workers.dev). O nome em `wrangler.jsonc` precisa ser igual ao nome do Worker no Cloudflare. Configure também `BRAVOPAY_KEY` conforme as instruções acima.

## Publicar como Pages

1. Suba esta pasta num repositório GitHub e conecte no Cloudflare Pages (output directory: `public`). Ou use `npx wrangler pages deploy public --project-name pix-relatorio`.
2. Configure `BRAVOPAY_KEY` em Settings → Variables and Secrets.
3. Opcional: configure `WEBHOOK_SECRET` e cadastre no painel BravoPay `https://SEU-SITE.pages.dev/api/webhook?secret=SEU_WEBHOOK_SECRET`.

## Valor e dados do relatório

- `functions/_lib.js`: `VALOR_CENTAVOS` (1500 = R$ 15,00).
- `functions/_dados/fornecedores.js`: lista privada de fornecedores e valores.

Não coloque a lista privada em `public/` nem em repositório público.

## Rotas

- `POST /api/create`: cria cobrança Pix.
- `GET /api/pix?id=...`: aguarda/consulta o código Pix da cobrança.
- `GET /api/status?id=...`: confirma pagamento consultando a BravoPay.
- `POST /api/webhook`: recebe aviso e reconfirma via GET.
- `GET /api/report?id=...`: devolve a lista somente após confirmação.
