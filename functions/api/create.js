import { json, criarTransacao, buscarTransacao, getChave, extrairPix, extrairId, esperar } from "../_lib.js";

// POST /api/create  -> cria a cobrança PIX (valor em VALOR_CENTAVOS, no _lib.js)
export async function onRequestPost({ env }) {
  if (!getChave(env)) return json({ error: "Chave da BravoPay não configurada" }, 500);

  const r = await criarTransacao(env);
  if (!r.ok || !r.body) {
    console.log("BravoPay recusou", r.status, JSON.stringify(r.body));
    return json({ error: "Falha ao criar cobrança", bravopay_status: r.status, detalhe: r.body }, 502);
  }

  const id = extrairId(r.body);
  let copyPaste = extrairPix(r.body);

  // se a cobrança foi criada mas o código ainda não veio, consulta de novo (até 3x)
  for (let i = 0; id && !copyPaste && i < 3; i++) {
    await esperar(1500);
    const g = await buscarTransacao(env, id);
    if (g.ok) copyPaste = extrairPix(g.body);
  }

  if (!id || !copyPaste) {
    console.log("Resposta inesperada", JSON.stringify(r.body));
    return json({ error: "Resposta inesperada da BravoPay", bravopay_status: r.status, detalhe: r.body }, 502);
  }
  return json({ id, copy_paste: copyPaste });
}
