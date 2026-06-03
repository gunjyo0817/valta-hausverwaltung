import type { Lang } from "@/lib/api";

export type DemoUploadedFile = {
  name: string;
  type: string;
  size: number;
  url: string;
};

export type DemoUploadKind = "image" | "document";

export const DEMO_UPLOAD_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const DEMO_UPLOAD_MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DEMO_UPLOAD_MAX_FILES = 5;

const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]);
const documentTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export class DemoUploadError extends Error {
  constructor(
    message: string,
    public code: "too_many" | "too_large" | "invalid_type" | "read_failed",
  ) {
    super(message);
  }
}

function isAllowedType(file: File, kind: DemoUploadKind) {
  if (kind === "image") return imageTypes.has(file.type) || file.type.startsWith("image/");
  return documentTypes.has(file.type) || file.type.startsWith("image/");
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new DemoUploadError("File could not be read.", "read_failed"));
    reader.readAsDataURL(file);
  });
}

export async function demoUploadFiles(
  files: FileList | File[] | null | undefined,
  options: { kind: DemoUploadKind; maxFiles?: number },
): Promise<DemoUploadedFile[]> {
  const list = Array.from(files ?? []);
  const maxFiles = options.maxFiles ?? DEMO_UPLOAD_MAX_FILES;
  const maxBytes = options.kind === "image" ? DEMO_UPLOAD_MAX_IMAGE_BYTES : DEMO_UPLOAD_MAX_DOCUMENT_BYTES;

  if (list.length > maxFiles) {
    throw new DemoUploadError(`Only ${maxFiles} file(s) are allowed.`, "too_many");
  }

  for (const file of list) {
    if (!isAllowedType(file, options.kind)) {
      throw new DemoUploadError(`Unsupported file type: ${file.name}`, "invalid_type");
    }
    if (file.size > maxBytes) {
      throw new DemoUploadError(`File is too large: ${file.name}`, "too_large");
    }
  }

  return Promise.all(
    list.map(async (file) => ({
      name: file.name,
      type: file.type || (options.kind === "image" ? "image" : "document"),
      size: file.size,
      url: await readAsDataUrl(file),
    })),
  );
}

export function demoUploadErrorMessage(error: unknown, lang: Lang) {
  if (error instanceof DemoUploadError) {
    if (error.code === "too_many") return lang === "EN" ? "Upload up to 5 files at once." : "Lade maximal 5 Dateien gleichzeitig hoch.";
    if (error.code === "too_large") return lang === "EN" ? "The selected file is too large for the demo upload." : "Die ausgewaehlte Datei ist fuer den Demo-Upload zu gross.";
    if (error.code === "invalid_type") return lang === "EN" ? "This file type is not supported." : "Dieser Dateityp wird nicht unterstuetzt.";
    return lang === "EN" ? "The file could not be read." : "Die Datei konnte nicht gelesen werden.";
  }

  return error instanceof Error
    ? error.message
    : (lang === "EN" ? "The upload failed." : "Der Upload ist fehlgeschlagen.");
}

export function formatDemoFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
