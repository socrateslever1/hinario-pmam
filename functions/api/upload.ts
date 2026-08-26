import { storagePutWithRollback } from "../../server/storage";
import { query } from "../../server/mysql";
import { canUseGenericUpload, validateGenericUpload } from "../../server/genericUpload";
import { authenticatePagesUser } from "../_shared/authenticateUser";

export const onRequestPost: PagesFunction = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  try {
    const user = await authenticatePagesUser(context.request);
    if (!user) return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    if (!await canUseGenericUpload(user)) {
      return Response.json({ error: "Você não possui permissão para enviar arquivos." }, { status: 403 });
    }
    const formData = await context.request.formData();
    const file = formData.get("file");
    
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file provided" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const validation = validateGenericUpload(file);
    if ("error" in validation) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to Uint8Array for storagePut
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Read folder parameter
    const folder = (formData.get("folder") as string || "uploads").replace(/[^a-zA-Z0-9_/-]/g, "").replace(/^\/+|\/+$/g, "") || "uploads";
    
    // Generate unique filename
    const ext = validation.extension;
    const cleanPrefix = folder.replace(/[/_]/g, "-");
    const filename = `${cleanPrefix}-${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`;
    const fileKey = `${folder}/${filename}`;
    
    // Upload to Storage
    const result = await storagePutWithRollback(
      fileKey,
      buffer,
      validation.mimeType,
      async ({ url, key }) => {
        const insert = await query<any>(
          `INSERT INTO pmam_upload_registry
            (file_key, file_url, file_name, mime_type, file_size, folder, status, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, 'stored', ?)`,
          [key, url, file.name, validation.mimeType, file.size, folder, user.id],
        );
        return { url, key, uploadId: Number((insert as any).insertId), folder };
      },
    );

    const publicUrl = new URL(result.url, context.request.url).toString();
    const edgeCache = (caches as unknown as { default: Cache }).default;
    const cachedResponse = new Response(buffer.slice(), {
      headers: {
        "content-type": validation.mimeType,
        "content-length": String(file.size),
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
    context.waitUntil(edgeCache.put(new Request(publicUrl), cachedResponse));

    return new Response(JSON.stringify(result), {
      status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
};
