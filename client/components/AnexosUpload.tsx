import React, { useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface Anexo {
  id?: number; // present once persisted server-side (live mode)
  nome: string;
  url: string;
  tipo?: string;
}

interface AnexosUploadProps {
  anexos: Anexo[];
  onChange: (anexos: Anexo[]) => void | Promise<unknown>;
  maxAnexos: number;
  // Live mode: when both are given, each add/remove hits the server immediately
  // (used when editing an entity that already exists). Without them, files are
  // just uploaded to get a URL and held in local state until the caller saves
  // the parent entity and attaches them itself.
  anexarUrl?: string;
  removerUrlBase?: string;
}

const MAX_UPLOAD_TIME_MS = 15000;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
];
const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function AnexosUpload({
  anexos,
  onChange,
  maxAnexos,
  anexarUrl,
  removerUrlBase,
}: AnexosUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isLive = !!anexarUrl;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    if (anexos.length + newFiles.length > maxAnexos) {
      toast.error("Máximo de anexos atingido", {
        description: `Máximo permitido: ${maxAnexos}. Você tem ${anexos.length}.`,
      });
      return;
    }

    setIsUploading(true);
    const novosAnexos: Anexo[] = [];

    try {
      for (const file of newFiles) {
        if (!ALLOWED_MIMES.includes(file.type)) {
          toast.error(`${file.name}: formato inválido`, {
            description: "Use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, JPEG, PNG, GIF ou WEBP.",
          });
          continue;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
          toast.error(`${file.name}: extensão inválida`, {
            description: `Use: ${ALLOWED_EXTENSIONS.join(", ")}`,
          });
          continue;
        }

        if (file.size === 0) {
          toast.error(`${file.name}: arquivo vazio`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: arquivo muito grande`, {
            description: `Tamanho: ${formatFileSize(file.size)} | Máximo: ${MAX_FILE_SIZE_MB}MB`,
          });
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), MAX_UPLOAD_TIME_MS);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            signal: abortController.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || `Erro ao enviar ${file.name}`);
          }

          const data = await response.json();
          if (!data.url) throw new Error("URL do arquivo não retornada pelo servidor");

          if (isLive && anexarUrl) {
            const anexarResponse = await fetch(anexarUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nome: file.name, url: data.url }),
            });
            if (!anexarResponse.ok) {
              const errorData = await anexarResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Erro ao anexar ${file.name}`);
            }
            const anexarResult = await anexarResponse.json();
            novosAnexos.push(anexarResult.data);
          } else {
            novosAnexos.push({ nome: file.name, url: data.url });
          }

          toast.success(`${file.name} anexado`);
        } catch (uploadError) {
          clearTimeout(timeoutId);
          const message =
            uploadError instanceof Error
              ? uploadError.name === "AbortError"
                ? `${file.name}: tempo de envio excedido`
                : uploadError.message
              : `Erro ao enviar ${file.name}`;
          toast.error(message);
        }
      }

      if (novosAnexos.length > 0) {
        // Await so the spinner stays up through the caller's own refetch/state update too -
        // otherwise it flips off right as the parent is still re-fetching, and the new
        // attachment appears to have vanished for the second or two until that resolves.
        await onChange([...anexos, ...novosAnexos]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeAnexo = async (index: number) => {
    const anexo = anexos[index];

    setIsRemoving(true);
    if (isLive && anexo.id && removerUrlBase) {
      try {
        const response = await fetch(`${removerUrlBase}/${anexo.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error((await response.json()).error || "Erro ao remover anexo");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao remover anexo");
        setIsRemoving(false);
        return;
      }
    }

    await onChange(anexos.filter((_, i) => i !== index));
    setIsRemoving(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="file"
          id={`anexos-upload-${anexarUrl || "pending"}`}
          multiple
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isUploading || isRemoving || anexos.length >= maxAnexos}
          className="hidden"
        />
        <label
          htmlFor={`anexos-upload-${anexarUrl || "pending"}`}
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm ${
            isUploading || isRemoving || anexos.length >= maxAnexos
              ? "bg-gray-50 border-gray-300 cursor-not-allowed text-vitrii-text-secondary"
              : "border-vitrii-blue hover:bg-blue-50 text-vitrii-blue"
          }`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vitrii-blue" />
              Processando anexo...
            </>
          ) : isRemoving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vitrii-blue" />
              Removendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Anexar arquivo ({anexos.length}/{maxAnexos})
            </>
          )}
        </label>
      </div>

      {anexos.length > 0 && (
        <ul className="space-y-1.5">
          {anexos.map((anexo, index) => {
            const extension = anexo.url.split(".").pop()?.toLowerCase() || "";
            const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
            return (
              <li
                key={anexo.id ?? `${anexo.url}-${index}`}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                {isImage ? (
                  <ImageIcon className="w-4 h-4 text-vitrii-blue flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate text-vitrii-text hover:text-vitrii-blue hover:underline"
                >
                  {anexo.nome}
                </a>
                <button
                  type="button"
                  onClick={() => removeAnexo(index)}
                  disabled={isUploading || isRemoving}
                  className="text-gray-400 hover:text-red-600 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover anexo"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-vitrii-text-secondary">
        PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, JPEG, PNG, GIF ou WEBP • máx {MAX_FILE_SIZE_MB}MB por arquivo
      </p>
    </div>
  );
}
