/*
 * image.ts — procesamiento de imágenes en el cliente.
 *
 * Hacemos todo en el cliente antes de mandar a /api/transform:
 *  - bajamos resolución a un máximo de ~1024px (lado mayor) para reducir
 *    costo y latencia de Gemini.
 *  - convertimos a JPEG con calidad 0.85 (buen ratio tamaño/calidad para
 *    retratos).
 *  - devolvemos dataURL listo para mandar como string en el body de la API.
 *
 * Por privacidad y por costo, la foto NO se manda en su tamaño original.
 */

const DEFAULT_MAX_SIDE = 1024;
const DEFAULT_JPEG_QUALITY = 0.85;

export class ImageProcessingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Redimensiona una imagen al lado máximo indicado (manteniendo proporción)
 * y la devuelve como dataURL JPEG. Si la imagen ya es más chica que
 * `maxSide`, no la agranda — sólo se asegura del tipo JPEG.
 */
export async function resizeImage(
  file: File,
  maxSide: number = DEFAULT_MAX_SIDE,
  quality: number = DEFAULT_JPEG_QUALITY,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageProcessingError(
      `El archivo no parece ser una imagen (tipo: ${file.type || "desconocido"}).`,
    );
  }

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
  const targetW = Math.round(img.width * ratio);
  const targetH = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageProcessingError(
      "No se pudo crear el contexto de canvas para procesar la imagen.",
    );
  }

  // Mejorar la calidad del downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return canvas.toDataURL("image/jpeg", quality);
}

/** Convierte un dataURL en Blob, útil para descargar o compartir. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  if (!meta || !b64) {
    throw new ImageProcessingError("dataURL inválido.");
  }
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Genera un File a partir de un dataURL (para Web Share API). */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type });
}

/* ── Helpers internos ───────────────────────────────────────────────── */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(
        new ImageProcessingError(
          "No se pudo leer el archivo de imagen.",
          reader.error ?? undefined,
        ),
      );
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new ImageProcessingError(
          "No se pudo decodificar la imagen (¿formato no soportado?).",
        ),
      );
    img.src = src;
  });
}
