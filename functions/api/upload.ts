import { storagePut } from "../../server/storage";

export const onRequestPost: PagesFunction = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  try {
    const formData = await context.request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // Convert file to Uint8Array for storagePut
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Read folder parameter
    const folder = (formData.get("folder") as string || "uploads").replace(/[^a-zA-Z0-9_/-]/g, "").replace(/^\/+|\/+$/g, "") || "uploads";
    
    // Generate unique filename
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanPrefix = folder.replace(/[/_]/g, "-");
    const filename = `${cleanPrefix}-${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`;
    const fileKey = `${folder}/${filename}`;
    
    // Upload to Storage
    const { url, key } = await storagePut(
      fileKey,
      buffer,
      file.type
    );
    
    return new Response(JSON.stringify({ url, key, folder }), { 
      status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
};
