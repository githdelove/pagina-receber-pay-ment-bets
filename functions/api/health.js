import { json, getChave } from "../_lib.js";

// Diagnóstico público mínimo: nunca retorna nome de chave, valor ou informação sensível.
export async function onRequestGet({ env }) {
  const configurada = Boolean(getChave(env));
  return json({ ok: configurada, bravopay_key_configured: configurada }, configurada ? 200 : 503);
}
