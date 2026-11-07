import { json, criarTransacao, getChave, extrairPix, extrairId } from "../_lib.js";

// POST /api/create  -> cria a cobrança PIX (valor em VALOR_CENTAVOS, no _lib.js)
// A BravoPay leva de 5 a 30s para gerar o código. Por isso respondemos na hora com o id
// e a página consulta /api/pix?id=... até o código ficar pronto.
export async function onRequestPost({ env }) {
  if (!getChave(env)) return json({ error: "Chave da BravoPay não configurada" }, 500);

  const r = await criarTransacao(env);
  const id = r.ok ? extrairId(r.body) : null;
  if (!id) {
    // detalhes só nos logs do Worker (a resposta da BravoPay pode ter dados pessoais)
    console.log("BravoPay recusou", r.status, JSON.stringify(r.body));
    return json({ error: "Falha ao criar cobrança", bravopay_status: r.status }, 502);
  }
  return json({ id, copy_paste: extrairPix(r.body) || null });
}
