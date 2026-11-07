import { json, criarTransacao, getChave, extrairPix, extrairId } from "../_lib.js";

// POST /api/create -> cria a cobrança PIX e retorna o payload, quando já disponível.
export async function onRequestPost({ env }) {
  if (!getChave(env)) return json({ error: "Pagamento temporariamente indisponível. Configure a chave BRAVOPAY_KEY no Cloudflare." }, 503);

  const r = await criarTransacao(env);
  const id = r.ok ? extrairId(r.body) : null;
  if (!id) {
    // Não devolva corpo bruto do provedor nem dados potencialmente sensíveis ao navegador.
    console.error("BravoPay create falhou", { status: r.status, error: r.body?.error || null });
    const status = r.status === 504 ? 504 : r.status === 503 ? 503 : 502;
    return json({ error: r.status === 504
      ? "A BravoPay está demorando para responder. Tente novamente."
      : "Não foi possível iniciar o pagamento. Confira a configuração da integração e tente novamente." }, status);
  }
  return json({ id, copy_paste: extrairPix(r.body) || null });
}
