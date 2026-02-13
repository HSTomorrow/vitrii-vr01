import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!file) {
    return cb(new Error("Nenhum arquivo foi enviado"));
  }

  if (!allowedMimes.includes(file.mimetype)) {
    const mimeType = file.mimetype || "desconhecido";
    const ext = path.extname(file.originalname) || "sem extensão";
    return cb(new Error(`Formato inválido: ${mimeType} (${ext}). Use JPEG, PNG, GIF ou WEBP.`));
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

      if (err.code === "FILE_TOO_LARGE") {
        return res.status(413).json({
          success: false,
          error: "Arquivo muito grande",
          details: "O arquivo excede o limite de 5MB. Comprima a imagem e tente novamente.",
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

export const handleUpload: RequestHandler = (req, res) => {
  try {
    if (!req.file) {
      console.warn("[handleUpload] Nenhum arquivo foi enviado");
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo foi enviado",
        details: "Selecione uma imagem para fazer upload",
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

    // Log successful upload
    console.log("[handleUpload] ✓ Upload bem-sucedido:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
      mimetype: req.file.mimetype,
    });

    // Build the URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: "Imagem enviada com sucesso",
    });
  } catch (error) {
    console.error("[handleUpload] 🔴 Erro:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer upload da imagem",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};
