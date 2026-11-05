import { json, buscarTransacao, estaPago, idValido } from "../_lib.js";

// GET /api/status?id=...  -> { paid: true|false }
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");
  if (!idValido(id)) return json({ error: "id inválido" }, 400);

  const r = await buscarTransacao(env, id);
  if (!r.ok) return json({ error: "Transação não encontrada" }, 404);
  return json({ paid: estaPago(r.body) });
}
