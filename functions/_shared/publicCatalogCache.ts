export const PUBLIC_CATALOG_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

const PUBLIC_CATALOG_PROCEDURES = new Set([
  "blog.list",
  "buglePanel.list",
  "hymns.list",
  "ordemUnidaAudio.list",
  "ordemUnidaAudio.listVoiceProfiles",
]);

export function isPublicCatalogRequest(request: Request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/trpc/")) return false;

  const procedures = decodeURIComponent(url.pathname.slice("/api/trpc/".length)).split(",");
  return procedures.length > 0 && procedures.every((procedure) => PUBLIC_CATALOG_PROCEDURES.has(procedure));
}
