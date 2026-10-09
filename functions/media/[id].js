// Yuklangan rasmlar: /media/<id>
export async function onRequestGet({ params, env }) {
  const id = String(params.id || "").replace(/\.\w+$/, "");
  if (!/^[a-z0-9]{8,32}$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare("SELECT mime, data FROM media WHERE id = ?").bind(id).first();
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "content-type": row.mime, "cache-control": "public, max-age=31536000, immutable" },
  });
}
