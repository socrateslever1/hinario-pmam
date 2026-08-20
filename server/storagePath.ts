export function normalizeStorageKey(value: string) {
  const segments = value.replace(/\\/g, "/").split("/").filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return segments.join("/");
}

export function publicStorageUrl(key: string) {
  const normalized = normalizeStorageKey(key);
  return `/uploads/${normalized.split("/").map(encodeURIComponent).join("/")}`;
}

export function storageKeyFromRouteParam(path: string | string[] | undefined) {
  if (!path) throw new Error("Arquivo não informado.");
  const raw = Array.isArray(path) ? path.join("/") : path;
  return normalizeStorageKey(raw.split("/").map((segment) => decodeURIComponent(segment)).join("/"));
}
