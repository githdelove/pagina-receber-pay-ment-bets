import { json, criarTransacao } from "../_lib.js";

// POST /api/create  -> cria a cobrança PIX de R$ 15,00
export async function onRequestPost({ env }) {
  if (!env.BRAVOPAY_KEY) return json({ error: "BRAVOPAY_KEY não configurada" }, 500);

  const r = await criarTransacao(env);
  if (!r.ok || !r.body) {
    return json({ error: "Falha ao criar cobrança", detalhe: r.body }, 502);
  }
  const t = r.body.data && typeof r.body.data === "object" ? r.body.data : r.body;
  const copyPaste = t.pix?.copy_paste;
  if (!t.id || !copyPaste) {
    return json({ error: "Resposta inesperada da BravoPay", detalhe: r.body }, 502);
  }
  return json({ id: t.id, copy_paste: copyPaste });
}
