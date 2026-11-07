// Utilidades compartilhadas (BravoPay)

// Valor da cobrança em centavos: 1500 = R$ 15,00.
export const VALOR_CENTAVOS = 1500;

// Configure BRAVOPAY_KEY como Secret no Cloudflare. Nunca publique a chave no código.
export const getChave = (env) => (env && typeof env.BRAVOPAY_KEY === "string" ? env.BRAVOPAY_KEY.trim() : "");

const BASE = "https://bravopay.club/api/v1";
const STATUS_PAGO = ["paid", "approved", "completed", "confirmed", "succeeded", "pago"];

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function bravo(env, path, options = {}) {
  if (!getChave(env)) return { ok: false, status: 503, body: { error: "BRAVOPAY_KEY não configurada" } };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(BASE + path, {
      ...options,
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${getChave(env)}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const texto = await res.text();
    let body = null;
    try { body = JSON.parse(texto); } catch { body = texto ? { resposta_bruta: texto.slice(0, 300) } : null; }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    const timeout = e && e.name === "AbortError";
    return { ok: false, status: timeout ? 504 : 0, body: { error: timeout ? "Tempo limite ao consultar a BravoPay" : "Falha de conexão com a BravoPay" } };
  } finally {
    clearTimeout(t);
  }
}

export const criarTransacao = (env) =>
  bravo(env, "/transactions", {
    method: "POST",
    body: JSON.stringify({ amount_cents: VALOR_CENTAVOS }),
  });

export const buscarTransacao = (env, id) =>
  bravo(env, `/transactions/${encodeURIComponent(id)}`);

// Decide se a transação está paga (a fonte da verdade é sempre o GET na BravoPay).
export function estaPago(tx) {
  if (!tx) return false;
  const t = tx.data && typeof tx.data === "object" ? tx.data : tx;
  const status = String(t.status || "").toLowerCase();
  if (!STATUS_PAGO.includes(status) && !t.paid_at) return false;
  const valor = t.amount_cents ?? t.amount;
  if (valor !== undefined && Number(valor) !== VALOR_CENTAVOS) return false;
  return true;
}

export function idValido(id) {
  return typeof id === "string" && /^[A-Za-z0-9_\-]{6,100}$/.test(id);
}

// Localiza o payload Pix EMV em diferentes formatos de resposta do provedor.
export function extrairPix(body) {
  const vistos = new Set();
  const camposPix = /^(pix|pix_code|pixcode|copy.?paste|br.?code|emv|payload|qr.?code|qr.?string|qr.?data|encoded.?image)$/i;
  const achar = (v, prof = 0, chave = "") => {
    if (prof > 10 || v == null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      // O payload copia e cola começa pelo identificador EMV 000201.
      return /^000201/.test(t) && t.length > 30 ? t : null;
    }
    if (typeof v !== "object" || vistos.has(v)) return null;
    vistos.add(v);
    // Primeiro prioriza propriedades conhecidas para não confundir URLs/imagens com o payload.
    for (const [k, valor] of Object.entries(v)) {
      if (camposPix.test(k)) {
        const r = achar(valor, prof + 1, k);
        if (r) return r;
      }
    }
    for (const [k, valor] of Object.entries(v)) {
      if (!camposPix.test(k)) {
        const r = achar(valor, prof + 1, k);
        if (r) return r;
      }
    }
    return null;
  };
  return achar(body);
}

export function extrairId(body) {
  if (!body || typeof body !== "object") return null;
  const t = body.data && typeof body.data === "object" ? body.data : body;
  const id = t.id ?? t.transaction_id ?? t.uuid ?? t.reference ?? body.id ?? body.transaction_id;
  return id == null ? null : String(id);
}
