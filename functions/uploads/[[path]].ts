import { storageKeyFromRouteParam } from "../../server/storagePath";
import { getDatabaseObjectChunk, getDatabaseObjectMetadata } from "../../server/databaseObjectStorage";

type UploadsEnv = { UPLOADS_BUCKET?: R2Bucket };

async function serve(
  context: EventContext<UploadsEnv, string, Record<string, unknown>>,
  headOnly: boolean,
) {
  let key: string;
  try {
    key = storageKeyFromRouteParam(context.params.path as string | string[] | undefined);
  } catch {
    return new Response("Arquivo inválido.", { status: 400 });
  }

  if (!context.env.UPLOADS_BUCKET) {
    const metadata = await getDatabaseObjectMetadata(key);
    if (!metadata) return context.next();
    const headers = new Headers({
      "content-type": metadata.mimeType,
      "accept-ranges": "bytes",
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=31536000, immutable",
    });
    if (headOnly) {
      headers.set("content-length", String(metadata.fileSize));
      return new Response(null, { status: 200, headers });
    }

    const rangeHeader = context.request.headers.get("range");
    const match = rangeHeader?.match(/^bytes=(\d*)-(\d*)$/);
    let start = 0;
    let end = metadata.fileSize - 1;
    let status = 200;
    if (match) {
      start = match[1] ? Number(match[1]) : 0;
      end = match[2] ? Math.min(Number(match[2]), end) : end;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= metadata.fileSize) {
        headers.set("content-range", `bytes */${metadata.fileSize}`);
        return new Response(null, { status: 416, headers });
      }
      status = 206;
      headers.set("content-range", `bytes ${start}-${end}/${metadata.fileSize}`);
    }
    headers.set("content-length", String(end - start + 1));
    const firstChunk = Math.floor(start / metadata.chunkSize);
    const lastChunk = Math.floor(end / metadata.chunkSize);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let index = firstChunk; index <= lastChunk; index += 1) {
            const chunk = await getDatabaseObjectChunk(key, index);
            if (!chunk) throw new Error(`Bloco ${index} ausente`);
            const from = index === firstChunk ? start % metadata.chunkSize : 0;
            const to = index === lastChunk ? (end % metadata.chunkSize) + 1 : chunk.length;
            controller.enqueue(chunk.subarray(from, to));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return new Response(stream, { status, headers });
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
