// Ponto de entrada do Cloudflare Worker.
// Direciona /api/* para as funções da pasta functions/ e serve o site (public/).
import * as create from "./functions/api/create.js";
import * as status from "./functions/api/status.js";
import * as report from "./functions/api/report.js";
import * as webhook from "./functions/api/webhook.js";

const ROTAS = {
  "/api/create":  { POST: create.onRequestPost },
  "/api/status":  { GET: status.onRequestGet },
  "/api/report":  { GET: report.onRequestGet },
  "/api/webhook": { POST: webhook.onRequestPost },
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      const rota = ROTAS[pathname.replace(/\/$/, "")];
      if (!rota) return Response.json({ error: "rota não encontrada" }, { status: 404 });
      const handler = rota[request.method];
      if (!handler) return Response.json({ error: "método não permitido" }, { status: 405 });
      return handler({ request, env, ctx });
    }

    // qualquer outra coisa: arquivos do site (public/)
    return env.ASSETS.fetch(request);
  },
};
