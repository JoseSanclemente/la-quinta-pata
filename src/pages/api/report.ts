import type { APIRoute } from "astro";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, REPORT_NOTIFY_EMAIL } from "astro:env/server";
import { dbAdmin } from "@/lib/supabase.server";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recentReports = new Map<string, number[]>();

function overLimit(key: string): boolean {
  const now = Date.now();
  const hits = (recentReports.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recentReports.set(key, hits);
    return true;
  }
  hits.push(now);
  recentReports.set(key, hits);
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== "string" || !id) {
    return new Response(JSON.stringify({ error: "id requerido" }), { status: 400 });
  }

  if (overLimit(clientAddress ?? "desconocido")) {
    return new Response(JSON.stringify({ error: "demasiados reportes" }), {
      status: 429,
    });
  }

  const { data, error } = await dbAdmin
    .from("memories")
    .update({ hidden: true })
    .eq("id", id)
    .select("id, title, author")
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "no se pudo ocultar la memoria" }), {
      status: 500,
    });
  }

  const mail = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: REPORT_NOTIFY_EMAIL,
      subject: "Memoria reportada en La Quinta Pata",
      text: `Se reportó una memoria y fue ocultada del mapa.\n\nID: ${data.id}\nTítulo: ${data.title ?? "Sin título"}\nAutor: ${data.author ?? "Anónimo"}`,
    }),
  }).catch(() => null);

  if (!mail || !mail.ok) {
    console.error("resend", mail?.status, await mail?.text());
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
