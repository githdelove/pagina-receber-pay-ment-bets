import { json, buscarTransacao, extrairPix, idValido } from "../_lib.js";

// GET /api/pix?id=...  -> { copy_paste: "000201..." | null, expired: true|false }
// null = a BravoPay ainda está gerando o código (5 a 30s).
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");
  if (!idValido(id)) return json({ error: "id inválido" }, 400);

  const r = await buscarTransacao(env, id);
  if (!r.ok) return json({ error: "Transação não encontrada" }, 404);

  const t = r.body && r.body.data && typeof r.body.data === "object" ? r.body.data : r.body || {};
  const expira = t.pix && t.pix.expires_at ? Date.parse(t.pix.expires_at) : NaN;
  const expired = Number.isFinite(expira) && expira < Date.now();
  // devolve só o necessário (nada de dados do cliente)
  return json({ copy_paste: extrairPix(r.body) || null, expired });
}
