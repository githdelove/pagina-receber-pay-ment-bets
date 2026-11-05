import { json, buscarTransacao, estaPago, idValido } from "../_lib.js";
import { FORNECEDORES } from "../_dados/fornecedores.js";

// GET /api/report?id=...  -> devolve a lista só se a BravoPay confirmar o pagamento
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");
  if (!idValido(id)) return json({ error: "id inválido" }, 400);

  const r = await buscarTransacao(env, id);
  if (!r.ok || !estaPago(r.body)) return json({ error: "Pagamento não confirmado" }, 402);

  return json({ fornecedores: FORNECEDORES });
}
