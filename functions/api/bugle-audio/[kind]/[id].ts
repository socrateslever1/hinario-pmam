import { query } from "../../../../server/mysql";

async function mediaResponse(value: string, fallbackType: string, requestUrl: string) {
  // 1. data: URI stored inline in the DB — decode and serve directly
  if (value.startsWith("data:")) {
    const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(value);
    if (!match) return new Response("Áudio inválido", { status: 500 });
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "Content-Type": match[1] || fallbackType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Content-Length": String(bytes.byteLength),
      },
    });
  }

  // 2. Local /uploads/ path — proxy through fetch using the same origin.
  //    Works in Node.js Express (dev). In Cloudflare Workers, /uploads/ doesn't
  //    exist, so re-upload the file via the admin panel to fix it.
  if (value.startsWith("/uploads/") || value.startsWith("/audio/")) {
    try {
      const origin = new URL(requestUrl).origin;
      const proxied = await fetch(`${origin}${value}`);
      if (!proxied.ok) {
        return new Response(
          "Arquivo de áudio não encontrado no servidor. Envie novamente pelo painel de administração.",
          { status: 404 }
        );
      }
      return new Response(proxied.body, {
        headers: {
          "Content-Type": proxied.headers.get("Content-Type") || fallbackType,
          "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        },
      });
    } catch {
      return new Response(
        "Arquivo de áudio não encontrado no servidor. Envie novamente pelo painel de administração.",
        { status: 404 }
      );
    }
  }

  // 3. External HTTP/HTTPS URL — redirect
  return Response.redirect(value, 302);
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
  return mediaResponse(String(row.audio_url), "audio/mpeg", context.request.url);
};

