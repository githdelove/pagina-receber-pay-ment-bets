# PIX R$ 15 – relatório completo (BravoPay)

Cloudflare Worker com assets estáticos em `public/` e rotas API em `functions/api/`.

## Corrigir/configurar a Secret do Worker

O endereço `*.workers.dev` é um **Worker**, não um projeto Pages. A chave deve estar vinculada ao Worker chamado `pagina-receber-pay-ment-bets` (nome em `wrangler.jsonc`). O código aceita `BRAVOPAY_KEY` (recomendado) e também os nomes antigos `BRAVOPAY_API_KEY` e `BRAVOPAY_TOKEN`.

### Pelo painel do Cloudflare

1. Abra **Workers & Pages** e selecione o Worker `pagina-receber-pay-ment-bets` — não configure a variável em Pages ou em outro Worker.
2. Abra **Settings → Variables and Secrets → Add → Secret**.
3. Nome: `BRAVOPAY_KEY`. Cole o token real no valor, salve e publique uma nova versão/deploy do Worker.
4. Teste `https://pagina-receber-pay-ment-bets.lhby123.workers.dev/api/health`. Deve retornar `{"ok":true,"bravopay_key_configured":true}`.

### Pelo Wrangler (alternativa)

Na raiz desta pasta, execute `npx wrangler login` e depois `npx wrangler secret put BRAVOPAY_KEY`. Quando solicitado, cole a chave no terminal. Esse comando grava a Secret no Worker especificado pelo `wrangler.jsonc`; faça o deploy normal depois. Não passe o valor da chave como argumento de comando nem o salve no GitHub.

O endpoint `/api/health` retorna somente `true` ou `false`; não revela a chave. Se retornar `false` ou 503, o Worker publicado ainda não recebeu a Secret, ou o GitHub está publicando outro Worker/projeto. Se retornar `true` mas `/api/create` falhar, a variável chegou e a resposta já não é esse erro de configuração: verifique se o token é válido e se o endpoint/conta BravoPay estão habilitados.

## Deploy pelo GitHub

Confira no workflow do GitHub Actions qual comando e qual `wrangler.jsonc` estão sendo usados. O `name` deve ser `pagina-receber-pay-ment-bets`. Se o deploy roda via GitHub Actions, configure o token da BravoPay **no Worker Cloudflare** como Secret; não basta criar uma Action secret no GitHub. O segredo do Cloudflare fica configurado no serviço e não precisa ser lido pelo workflow.

## Publicar como Worker

`worker.js` e `wrangler.jsonc` servem o site pelo Worker. O nome em `wrangler.jsonc` deve coincidir com o Worker de produção. Assets servidos da pasta `public/`.

## Publicar como Pages (alternativa distinta)

Se escolher Pages em vez do endereço workers.dev, configure a Secret dentro do projeto Pages e publique `public/` com as Pages Functions. Não misture a variável de um projeto Pages com um Worker `workers.dev`.

## Valor, dados e rotas

- `functions/_lib.js`: `VALOR_CENTAVOS` (1500 = R$ 15,00).
- `functions/_dados/fornecedores.js`: lista privada de fornecedores e valores.
- `POST /api/create`: cria cobrança Pix.
- `GET /api/pix?id=...`: consulta o código Pix.
- `GET /api/status?id=...`: confirma pagamento consultando a BravoPay.
- `POST /api/webhook`: recebe aviso e reconfirma via GET.
- `GET /api/report?id=...`: devolve a lista somente após confirmação.
- `GET /api/health`: confirma apenas se existe uma Secret disponível no runtime.

Não coloque a lista privada em `public/` nem em repositório público. Nunca publique a chave BravoPay no código ou no GitHub.
