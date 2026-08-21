import type { APIRoute } from "astro";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, REPORT_NOTIFY_EMAIL } from "astro:env/server";
import { dbAdmin } from "@/lib/supabase.server";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== "string" || !id) {
    return new Response(JSON.stringify({ error: "id requerido" }), { status: 400 });
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

  await fetch("https://api.resend.com/emails", {
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

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
