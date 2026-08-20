import { query } from "../../../server/mysql";

export const onRequestGet: PagesFunction = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  const profileKey = String(context.params.key || "").slice(0, 128);
  if (!profileKey) return new Response("Perfil inválido", { status: 400 });
  const rows = await query(
    `SELECT photo_url FROM pmam_voice_profiles WHERE profile_key = ? AND is_active = 1
     UNION ALL
     SELECT voice_author_photo_url photo_url FROM pmam_ordem_unida_audios WHERE voice_profile_key = ? AND is_active = 1 AND voice_author_photo_url IS NOT NULL
     LIMIT 1`,
    [profileKey, profileKey],
  );
  const value = String((rows[0] as any)?.photo_url || "");
  if (!value) return new Response("Foto não encontrada", { status: 404 });
  if (!value.startsWith("data:")) return Response.redirect(value, 302);
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(value);
  if (!match) return new Response("Foto inválida", { status: 500 });
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": match[1] || "image/jpeg",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Length": String(bytes.byteLength),
    },
  });
};
