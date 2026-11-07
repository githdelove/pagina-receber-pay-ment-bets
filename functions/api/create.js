import { json, criarTransacao, buscarTransacao, getChave, extrairPix, extrairId, esperar } from "../_lib.js";

// POST /api/create  -> cria a cobrança PIX (valor em VALOR_CENTAVOS, no _lib.js)
export async function onRequestPost({ env }) {
  if (!getChave(env)) return json({ error: "Chave da BravoPay não configurada" }, 500);

  const r = await criarTransacao(env);
  if (!r.ok || !r.body) {
    console.log("BravoPay recusou", r.status, JSON.stringify(r.body));
    return json({ error: "Falha ao criar cobrança", bravopay_status: r.status, detalhe_texto: JSON.stringify(r.body).slice(0, 1500) }, 502);
  }

  const id = extrairId(r.body);
  let copyPaste = extrairPix(r.body);

  // 202 = aceito, ainda processando: consulta a transação até o código PIX aparecer (~14s)
  let ultima = null;
  for (let i = 0; id && !copyPaste && i < 7; i++) {
    await esperar(2000);
    const g = await buscarTransacao(env, id);
    ultima = { status: g.status, corpo: JSON.stringify(g.body).slice(0, 800) };
    if (g.ok) copyPaste = extrairPix(g.body);
  }

  if (!id || !copyPaste) {
    console.log("Resposta inesperada", JSON.stringify(r.body), JSON.stringify(ultima));
    return json({
      error: "Resposta inesperada da BravoPay",
      bravopay_status: r.status,
      detalhe_texto: JSON.stringify(r.body).slice(0, 1500),
      ultima_consulta: ultima,
    }, 502);
  }
  return json({ id, copy_paste: copyPaste });
}
