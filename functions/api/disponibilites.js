// GET /api/disponibilites?golf=…&date=AAAA-MM-JJ&joueurs=N
// Créneaux en temps réel si un partenaire gère ce golf, sinon { temps_reel: false, mode: "demande" }.
import { disponibilites, golfs } from "../../lib/golf-providers.js";

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const id = u.searchParams.get("golf") || "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get("date") || "") ? u.searchParams.get("date") : "";
  const joueurs = Math.min(8, Math.max(1, parseInt(u.searchParams.get("joueurs"), 10) || 2));
  let golf;
  try { golf = (await golfs(env, request)).find((g) => g.i === id); } catch { golf = null; }
  if (!golf) return Response.json({ erreur: "golf inconnu" }, { status: 404 });
  return Response.json(await disponibilites(golf, date, joueurs, env), { headers: { "cache-control": "no-store" } });
}
