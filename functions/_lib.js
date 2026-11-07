// Utilidades compartilhadas (BravoPay)

// ==========================================================
//  CONFIGURAÇÃO: mude só aqui
// ==========================================================

// 1) VALOR DA COBRANÇA, em CENTAVOS: 1500 = R$ 15,00 | 2990 = R$ 29,90
export const VALOR_CENTAVOS = 1500;

// 2) SUA CHAVE DA BRAVOPAY: cole entre as aspas.
//    Hoje está uma chave FAKE (a BravoPay vai recusar). Troque pela real.
//    Se existir a variável BRAVOPAY_KEY no Cloudflare, ela tem prioridade.
//    ATENÇÃO: se o repositório for público, qualquer pessoa vê esta chave.
const CHAVE_PADRAO = "bp_live_9QilhTph2WycvXFi6OJ-KcVvBDDvrgQ2h7B7Cw";
 
// ==========================================================

export const getChave = (env) => (env && env.BRAVOPAY_KEY) || CHAVE_PADRAO;

const BASE = "https://bravopay.club/api/v1";
const STATUS_PAGO = ["paid", "approved", "completed", "confirmed", "succeeded", "pago"];

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function bravo(env, path, options = {}) {
  // se a BravoPay demorar mais que 25s, desiste e devolve erro claro
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
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
    return { ok: false, status: timeout ? 504 : 0, body: { error: timeout ? "BravoPay demorou demais (timeout)" : String(e) } };
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

// ---- Extração tolerante da resposta da BravoPay ----

// Procura em qualquer campo da resposta um texto que seja um PIX copia e cola
// (todo código PIX começa com "000201").
export function extrairPix(body) {
  const visto = new Set();
  const achar = (v, prof = 0) => {
    if (prof > 6 || v == null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return /^000201/.test(t) && t.length > 50 ? t : null;
    }
    if (typeof v === "object") {
      if (visto.has(v)) return null;
      visto.add(v);
      for (const k of Object.keys(v)) {
        const r = achar(v[k], prof + 1);
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

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
