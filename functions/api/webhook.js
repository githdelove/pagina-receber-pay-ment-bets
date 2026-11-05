import { json, buscarTransacao, estaPago, idValido } from "../_lib.js";

// POST /api/webhook?secret=SEU_SEGREDO
// Cadastre essa URL no painel da BravoPay.
// Não confiamos no corpo recebido: pegamos o id e reconfirmamos com GET na BravoPay.
export async function onRequestPost({ request, env }) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
    return json({ error: "não autorizado" }, 401);
  }

  let payload = {};
  try { payload = await request.json(); } catch {}
  const d = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const id = d.id || d.transaction_id || payload.transaction_id;
  if (!idValido(id)) return json({ ok: true, ignorado: true }); // responde 200 para não gerar retentativas

  const r = await buscarTransacao(env, id);
  const pago = r.ok && estaPago(r.body);

  // Opcional: se você criar um KV chamado PAGAMENTOS, o registro fica guardado
  if (env.PAGAMENTOS) {
    await env.PAGAMENTOS.put(`tx:${id}`, JSON.stringify({ pago, em: new Date().toISOString() }), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  }
  console.log("webhook", id, pago ? "PAGO" : "pendente");
  return json({ ok: true });
}
