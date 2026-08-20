import { storageKeyFromRouteParam } from "../../server/storagePath";

type UploadsEnv = { UPLOADS_BUCKET?: R2Bucket };

async function serve(
  context: EventContext<UploadsEnv, string, Record<string, unknown>>,
  headOnly: boolean,
) {
  if (!context.env.UPLOADS_BUCKET) return context.next();

  let key: string;
  try {
    key = storageKeyFromRouteParam(context.params.path as string | string[] | undefined);
  } catch {
    return new Response("Arquivo inválido.", { status: 400 });
  }

  const object = headOnly
    ? await context.env.UPLOADS_BUCKET.head(key)
    : await context.env.UPLOADS_BUCKET.get(key, {
        onlyIf: context.request.headers,
        range: context.request.headers,
      });
  if (!object) return context.next();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");

  if (headOnly) {
    headers.set("content-length", String(object.size));
    return new Response(null, { status: 200, headers });
  }
  if (!("body" in object)) return new Response(null, { status: 412, headers });

  const range = object.range;
  if (context.request.headers.has("range") && range && "offset" in range) {
    headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
    headers.set("content-length", String(range.length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}

export const onRequestGet: PagesFunction<UploadsEnv> = (context) => serve(context, false);
export const onRequestHead: PagesFunction<UploadsEnv> = (context) => serve(context, true);
