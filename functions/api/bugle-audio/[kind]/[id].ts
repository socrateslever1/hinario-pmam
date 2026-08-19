import { query } from "../../../../server/mysql";

function mediaResponse(value: string, fallbackType: string) {
  if (!value.startsWith("data:")) return Response.redirect(value, 302);
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(value);
  if (!match) return new Response("Áudio inválido", { status: 500 });
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": match[1] || fallbackType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Length": String(bytes.byteLength),
    },
  });
}

export const onRequestGet: PagesFunction = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  const kind = String(context.params.kind);
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Identificador inválido", { status: 400 });

  const table = kind === "march" ? "pmam_marches" : "pmam_bugle_calls";
  const rows = await query(`SELECT audio_url FROM ${table} WHERE id = ? AND is_active = 1 LIMIT 1`, [id]);
  const row: any = rows[0];
  if (!row?.audio_url) return new Response("Áudio não encontrado", { status: 404 });
  return mediaResponse(String(row.audio_url), "audio/mpeg");
};
