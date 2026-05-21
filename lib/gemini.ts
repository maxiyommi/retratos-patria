/*
 * gemini.ts — wrapper del SDK @google/genai.
 *
 * Encapsula la llamada al modelo gemini-2.5-flash-image (Nano Banana) que
 * acepta texto + imagen y devuelve imagen. Sólo se usa server-side: la
 * GEMINI_API_KEY nunca llega al cliente.
 *
 * Modelo: gemini-2.5-flash-image
 *   - Tier gratuito: ~500 imágenes/día, ~10/min.
 *   - Para uso con menores, conviene tier pago (no usa los datos para
 *     entrenamiento). Ver content/terminos.md.
 *
 * Cliente singleton — instanciamos una sola vez por proceso del servidor.
 */

import { GoogleGenAI, Modality } from "@google/genai";

const MODEL_ID = "gemini-2.5-flash-image";

export class GeminiError extends Error {
  constructor(
    message: string,
    public statusHint: number = 502,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      "El servidor no tiene configurada la clave de Gemini.",
      503,
    );
  }
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export interface TransformResult {
  /** dataURL listo para mandar al cliente. */
  imageDataUrl: string;
}

/**
 * Manda la foto del usuario + el prompt del personaje a Gemini y devuelve
 * el retrato generado.
 *
 * @param imageBase64 — sólo los bytes base64 (sin el prefijo data:).
 * @param imageMimeType — ej. "image/jpeg".
 * @param prompt — texto que describe la transformación deseada.
 */
export async function transformPortrait(
  imageBase64: string,
  imageMimeType: string,
  prompt: string,
): Promise<TransformResult> {
  const ai = getClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
  } catch (err) {
    // Errores de red, autenticación, cuota, etc. Pasamos el mensaje
    // original como cause para loguear, pero mostramos uno amigable.
    const message = (err as Error)?.message ?? "";

    // "limit: 0" en la cuota indica que el modelo de imágenes no tiene
    // tier gratuito asignado al proyecto — hay que habilitar billing.
    // Es distinto de un rate limit transitorio (que sí tiene cuota > 0
    // y se resuelve esperando).
    if (/limit:\s*0/i.test(message) || /billing/i.test(message)) {
      throw new GeminiError(
        "El modelo de retratos no tiene cuota gratuita. Hay que habilitar billing en el proyecto de Google AI Studio para usarlo.",
        402,
        err,
      );
    }
    if (/quota|rate|RESOURCE_EXHAUSTED/i.test(message)) {
      throw new GeminiError(
        "Estamos pintando muchos retratos al mismo tiempo. Probá en un minuto.",
        429,
        err,
      );
    }
    if (/api key|unauthorized|401|403/i.test(message)) {
      throw new GeminiError(
        "El servidor no pudo autenticarse con Gemini. Revisá la clave.",
        503,
        err,
      );
    }
    throw new GeminiError(
      "No pudimos comunicarnos con el artista (Gemini). Probá de nuevo.",
      502,
      err,
    );
  }

  // Extraemos la primera parte inline con mimeType de imagen.
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part.inlineData?.data;
    const mime = part.inlineData?.mimeType;
    if (data && mime?.startsWith("image/")) {
      return { imageDataUrl: `data:${mime};base64,${data}` };
    }
  }

  // Si llegamos acá es porque Gemini respondió sin imagen — típicamente
  // bloqueo por filtros de seguridad, o la foto no fue interpretable.
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") {
    throw new GeminiError(
      "El sistema de seguridad bloqueó la generación. Probá con otra foto o personaje.",
      422,
    );
  }
  if (finishReason === "RECITATION") {
    throw new GeminiError(
      "La transformación fue bloqueada. Probá con otra foto.",
      422,
    );
  }

  throw new GeminiError(
    "El artista no devolvió ningún retrato. Probá de nuevo.",
    502,
  );
}
