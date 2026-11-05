// Utilidades compartilhadas (BravoPay)
export const VALOR_CENTAVOS = 1500; // R$ 15,00 fixo
const BASE = "https://bravopay.club/api/v1";
const STATUS_PAGO = ["paid", "approved", "completed", "confirmed", "succeeded", "pago"];

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function bravo(env, path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.BRAVOPAY_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, body };
}

export const criarTransacao = (env) =>
  bravo(env, "/transactions", {
    method: "POST",
    body: JSON.stringify({ amount_cents: VALOR_CENTAVOS }),
  });

export const buscarTransacao = (env, id) =>
  bravo(env, `/transactions/${encodeURIComponent(id)}`);

// Decide se a transação está paga (a fonte da verdade é sempre o GET na BravoPay)
export function estaPago(tx) {
  if (!tx) return false;
  const t = tx.data && typeof tx.data === "object" ? tx.data : tx;
  const status = String(t.status || "").toLowerCase();
  if (!STATUS_PAGO.includes(status) && !t.paid_at) return false;
  // trava de segurança: se a API informar o valor, ele precisa ser R$ 15
  const valor = t.amount_cents ?? t.amount;
  if (valor !== undefined && Number(valor) !== VALOR_CENTAVOS) return false;
  return true;
}

export function idValido(id) {
  return typeof id === "string" && /^[A-Za-z0-9_\-]{6,100}$/.test(id);
}
