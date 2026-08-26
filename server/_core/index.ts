import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut, storagePutWithRollback } from "../storage";
import { query } from "../mysql";
import { canUseGenericUpload, MAX_GENERIC_UPLOAD_SIZE, validateGenericUpload } from "../genericUpload";
import crypto from "crypto";
import { getVersionInfo } from "./version";
import cors from "cors";
import path from "path";
import {
  MAX_BUGLE_AUDIO_SIZE,
  canManageBugleUploads,
  getCurrentBugleAudioUrl,
  setBugleAudioUrl,
  validateBugleUpload,
  type BugleUploadKind,
} from "../bugleUpload";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3002): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer(): Promise<{ app: express.Application; server: any; port: number }> {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy - required for correct cookie Secure flag behind reverse proxy
  app.set('trust proxy', 1);
  
  // Configure CORS to allow credentials
  app.use(cors({
    origin: (origin, callback) => {
      // Allow all origins - same-origin requests have no origin header
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-student-id', 'x-student-token', 'x-email-session'],
  }));
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "80mb" }));
  app.use(express.urlencoded({ limit: "80mb", extended: true }));
  app.use(express.text({ limit: "80mb" }));

  const rootUploadsDir = path.resolve(process.cwd(), "uploads");
  const clientUploadsDir = path.resolve(process.cwd(), "client", "public", "uploads");
  app.use("/uploads", express.static(rootUploadsDir));
  app.use("/uploads", express.static(clientUploadsDir));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Version endpoint for auto-update mechanism
  app.get("/api/version", (req, res) => {
    const versionInfo = getVersionInfo();
    res.json(versionInfo);
  });
  
  // File upload endpoint with folder organization
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_GENERIC_UPLOAD_SIZE }
  });
  
  app.post(
    "/api/upload",
    async (req, res, next) => {
      try {
        const ctx = await createContext({ req, res } as any);
        if (!ctx.user) return res.status(401).json({ error: "Sessão expirada. Entre novamente." });
        if (!await canUseGenericUpload(ctx.user)) {
          return res.status(403).json({ error: "Você não possui permissão para enviar arquivos." });
        }
        (req as any).uploadUser = ctx.user;
        return next();
      } catch (error) {
        console.error("[Generic upload auth]", error);
        return res.status(503).json({ error: "Não foi possível validar sua sessão agora." });
      }
    },
    (req, res, next) => {
      upload.single("file")(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "O arquivo deve ter no máximo 20 MB." });
          }
          return res.status(400).json({ error: `Erro no envio da imagem: ${error.message}` });
        }
        return res.status(400).json({ error: "Não foi possível processar a imagem enviada." });
      });
    },
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Nenhum arquivo enviado." });
        }
        const validation = validateGenericUpload({
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
        });
        if ("error" in validation) return res.status(400).json({ error: validation.error });

        // Determine folder category (commanders, cfap-backgrounds, blog, documents, etc.)
        const rawFolder = (req.body?.folder || req.query?.folder || "uploads").toString().trim();
        const safeFolder = rawFolder.replace(/[^a-zA-Z0-9_/-]/g, "").replace(/^\/+|\/+$/g, "") || "uploads";

        const ext = validation.extension;
        const cleanPrefix = safeFolder.replace(/[/_]/g, "-");
        const filename = `${cleanPrefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
        const fileKey = `${safeFolder}/${filename}`;

        const result = await storagePutWithRollback(
          fileKey,
          req.file.buffer,
          validation.mimeType,
          async ({ url, key }) => {
            const insert = await query<any>(
              `INSERT INTO pmam_upload_registry
                (file_key, file_url, file_name, mime_type, file_size, folder, status, uploaded_by)
               VALUES (?, ?, ?, ?, ?, ?, 'stored', ?)`,
              [key, url, req.file!.originalname, validation.mimeType, req.file!.size, safeFolder, (req as any).uploadUser.id],
            );
            return { url, key, folder: safeFolder, uploadId: Number((insert as any).insertId) };
          },
        );

        return res.json(result);
      } catch (error: any) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: error?.message || "Falha no envio da imagem" });
      }
    }
  );

  const bugleAudioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BUGLE_AUDIO_SIZE },
  });

  app.post(
    "/api/bugle-upload",
    (req, res, next) => {
      bugleAudioUpload.single("file")(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "O áudio deve ter no máximo 50 MB." });
        }
        return res.status(400).json({ error: "Não foi possível ler o arquivo enviado." });
      });
    },
    async (req, res) => {
      try {
        const ctx = await createContext({ req, res } as any);
        if (!ctx.user) return res.status(401).json({ error: "Sessão expirada. Entre novamente." });
        if (!await canManageBugleUploads(ctx.user)) {
          return res.status(403).json({ error: "Acesso restrito ao comando ou Xerife Geral." });
        }

        const kind = req.body.kind as BugleUploadKind;
        const id = Number(req.body.id);
        if ((kind !== "call" && kind !== "march") || !Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: "Destino do áudio inválido." });
        }
        if (!req.file) return res.status(400).json({ error: "Selecione um arquivo de áudio." });

        const validation = validateBugleUpload(req.file.originalname, req.file.size);
        if ("error" in validation) return res.status(400).json({ error: validation.error });
        if (await getCurrentBugleAudioUrl(kind, id) === undefined) {
          return res.status(404).json({ error: "Toque ou dobrado não encontrado." });
        }

        const folder = kind === "call" ? "calls" : "marches";
        const fileKey = `bugle/${folder}/${id}-${crypto.randomBytes(5).toString("hex")}.${validation.extension}`;
        const { url } = await storagePutWithRollback(fileKey, req.file.buffer, validation.mimeType, async ({ url }) => {
          await setBugleAudioUrl(kind, id, url);
          return { url };
        });
        return res.json({ success: true, url });
      } catch (error) {
        console.error("[Bugle upload]", error);
        return res.status(500).json({ error: "Não foi possível armazenar o áudio. Tente novamente." });
      }
    },
  );
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), "client/public/uploads")));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use("/audio", express.static(path.resolve(process.cwd(), "client/public/audio")));
  app.use("/audio", express.static(path.resolve(process.cwd(), "public/audio")));

  // Proxy endpoint for inline data: bugle audio in dev
  app.get("/api/bugle-audio/:kind/:id", async (req, res) => {
    try {
      const { query } = await import("../mysql");
      const kind = String(req.params.kind);
      const id = Number(req.params.id);
      const table = kind === "march" ? "pmam_marches" : "pmam_bugle_calls";
      const rows = await query(`SELECT audio_url FROM ${table} WHERE id = ? AND is_active = 1 LIMIT 1`, [id]);
      const row: any = rows[0];
      if (!row?.audio_url) return res.status(404).send("Áudio não encontrado");
      const value = String(row.audio_url);
      if (value.startsWith("data:")) {
        const match = /^data:([^;,]+)?;base64,([\s\S]+)$/.exec(value);
        if (!match) return res.status(500).send("Áudio inválido");
        const buffer = Buffer.from(match[2], "base64");
        res.set("Content-Type", match[1] || "audio/mpeg");
        return res.send(buffer);
      }
      return res.redirect(value);
    } catch (e) {
      return res.status(500).send("Erro interno");
    }
  });

  // Proxy endpoint for inline data: ordem unida audio in dev
  app.get("/api/ordem-unida-audio/:id", async (req, res) => {
    try {
      const { query } = await import("../mysql");
      const id = Number(req.params.id);
      const rows = await query("SELECT audio_url, mime_type FROM pmam_ordem_unida_audios WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
      const row: any = rows[0];
      if (!row?.audio_url) return res.status(404).send("Áudio não encontrado");
      const value = String(row.audio_url);
      if (value.startsWith("data:")) {
        const match = /^data:([^;,]+)?;base64,([\s\S]+)$/.exec(value);
        if (!match) return res.status(500).send("Áudio inválido");
        const buffer = Buffer.from(match[2], "base64");
        res.set("Content-Type", row.mime_type || match[1] || "audio/mpeg");
        return res.send(buffer);
      }
      return res.redirect(value);
    } catch (e) {
      return res.status(500).send("Erro interno");
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3002");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  
  return { app, server, port };
}

// Start server
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
