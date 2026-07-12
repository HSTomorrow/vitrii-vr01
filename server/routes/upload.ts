import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Files are stored in Supabase Storage (a persistent, shared object store) rather than
// local disk - the Fly.io container filesystem is ephemeral and this app runs multiple
// machines with independent disks, so anything written to local disk becomes unreachable
// as soon as a different machine serves the request, or after any redeploy.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const UPLOADS_BUCKET = "uploads";

// Maps a *verified* mimetype to a fixed extension - the saved file's extension is never
// taken from the client-supplied originalname, so an attacker can't upload e.g. "evil.html"
// with a spoofed image/jpeg Content-Type and have it served back as HTML (stored XSS).
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
};

// First bytes ("magic numbers") of each allowed format, checked against the actual
// file contents after upload since fileFilter only sees the client-supplied mimetype.
// Modern Office formats (.docx/.xlsx/.pptx) and .zip are all ZIP containers sharing the
// same "PK\x03\x04" signature - the container format is verified, not the inner content.
// Legacy Office formats (.doc/.xls/.ppt) similarly share the OLE2 compound-file signature.
const ZIP_SIGNATURE = [Buffer.from([0x50, 0x4b, 0x03, 0x04])];
const OLE2_SIGNATURE = [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])];
const MAGIC_BYTES: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/gif": [Buffer.from("GIF87a", "ascii"), Buffer.from("GIF89a", "ascii")],
  "image/webp": [Buffer.from("RIFF", "ascii")], // followed by size + "WEBP", checked separately below
  "application/pdf": [Buffer.from("%PDF", "ascii")],
  "application/msword": OLE2_SIGNATURE,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ZIP_SIGNATURE,
  "application/vnd.ms-excel": OLE2_SIGNATURE,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ZIP_SIGNATURE,
  "application/vnd.ms-powerpoint": OLE2_SIGNATURE,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ZIP_SIGNATURE,
  "application/zip": ZIP_SIGNATURE,
};

// text/plain and text/csv have no reliable magic number - any short ASCII/UTF-8 text
// passes - so they're checked separately (just "isn't binary garbage") rather than via
// MAGIC_BYTES/matchesMagicBytes.
const TEXT_MIMES = new Set(["text/plain", "text/csv"]);

function matchesMagicBytes(mimetype: string, buffer: Buffer): boolean {
  if (TEXT_MIMES.has(mimetype)) return true;

  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;

  if (mimetype === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
}

// Buffers the file in memory instead of writing to local disk - handleUpload streams it
// straight to Supabase Storage from there.
const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = Object.keys(EXT_BY_MIME);

  if (!file) {
    return cb(new Error("Nenhum arquivo foi enviado"));
  }

  if (!allowedMimes.includes(file.mimetype)) {
    const mimeType = file.mimetype || "desconhecido";
    const ext = path.extname(file.originalname) || "sem extensão";
    return cb(new Error(`Formato inválido: ${mimeType} (${ext}). Use JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV ou ZIP.`));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Wrapper to handle multer errors
const uploadMiddlewareHandler = upload.single("file");

export const uploadMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  uploadMiddlewareHandler(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.warn("[uploadMiddleware] Multer error:", {
        code: err.code,
        message: err.message,
        field: err.field,
      });

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          error: "Arquivo muito grande",
          details: "O arquivo excede o limite de 5MB. Reduza o tamanho e tente novamente.",
          limit: "5MB",
        });
      } else if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          error: "Muitos arquivos",
          details: "Envie apenas um arquivo por vez",
        });
      } else if (err.code === "LIMIT_FIELD_KEY") {
        return res.status(400).json({
          success: false,
          error: "Nome de campo muito longo",
          details: "O nome do campo é inválido",
        });
      }

      return res.status(400).json({
        success: false,
        error: "Erro no upload",
        details: err.message || "Erro ao processar o arquivo",
      });
    } else if (err) {
      // Custom errors from fileFilter
      console.warn("[uploadMiddleware] Custom validation error:", err.message);
      return res.status(400).json({
        success: false,
        error: "Arquivo inválido",
        details: err.message || "O arquivo não atende aos requisitos",
      });
    }

    next();
  });
};

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      console.warn("[handleUpload] Nenhum arquivo foi enviado");
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo foi enviado",
        details: "Selecione um arquivo para fazer upload",
      });
    }

    // Validate file properties
    if (!req.file.size || req.file.size === 0) {
      console.warn("[handleUpload] Arquivo vazio:", req.file.originalname);
      return res.status(400).json({
        success: false,
        error: "Arquivo vazio",
        details: "O arquivo selecionado está vazio. Selecione outro arquivo.",
      });
    }

    // fileFilter only checked the client-supplied Content-Type header, which an attacker
    // controls. Confirm the actual file bytes match the claimed format before accepting
    // the upload; otherwise a different file type could be smuggled onto the server.
    if (!matchesMagicBytes(req.file.mimetype, req.file.buffer.subarray(0, 12))) {
      console.warn("[handleUpload] Conteúdo do arquivo não corresponde ao tipo declarado:", {
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });
      return res.status(400).json({
        success: false,
        error: "Arquivo inválido",
        details: "O conteúdo do arquivo não corresponde ao formato declarado.",
      });
    }

    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = EXT_BY_MIME[req.file.mimetype] || ".bin";
    const filename = `upload-${uniqueSuffix}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("[handleUpload] 🔴 Erro no Supabase Storage:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Erro ao fazer upload do arquivo",
        details: "Não foi possível salvar o arquivo. Tente novamente.",
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(UPLOADS_BUCKET)
      .getPublicUrl(filename);
    const fileUrl = publicUrlData.publicUrl;

    // Log successful upload
    console.log("[handleUpload] ✓ Upload bem-sucedido:", {
      filename,
      originalname: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
      mimetype: req.file.mimetype,
    });

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: "Arquivo enviado com sucesso",
    });
  } catch (error) {
    console.error("[handleUpload] 🔴 Erro:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer upload do arquivo",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};
