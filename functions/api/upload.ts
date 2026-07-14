import { storagePut } from "../../server/storage";

export const onRequestPost: PagesFunction = async (context) => {
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
    
    // Generate unique filename
    const ext = file.name.split(".").pop();
    // crypto.randomUUID() is natively available in Cloudflare Workers
    const filename = `blog-${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`;
    
    // Upload to S3 (or Forge API)
    const { url } = await storagePut(
      `blog-images/${filename}`,
      buffer,
      file.type
    );
    
    return new Response(JSON.stringify({ url }), { 
      status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
};
