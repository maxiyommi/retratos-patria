/*
 * /api/transform — recibe la foto del usuario + selección de personaje,
 * llama a Gemini, devuelve el retrato pintado.
 *
 * Validaciones:
 *   - Rate limit simple in-memory por IP (5 requests / minuto).
 *   - Validación de schema del body (image dataURL, characterId conocido,
 *     gender válido).
 *   - El mensaje de error se devuelve en español rioplatense, apto para
 *     mostrar al usuario directamente.
 *
 * Lo que NUNCA hace:
 *   - Persistir la foto recibida.
 *   - Persistir el retrato generado.
 *   - Loguear el contenido de las imágenes (sólo metadata: bytes,
 *     character, latencia).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCharacterById, getPrompt } from "@/lib/characters";
import { GeminiError, transformPortrait } from "@/lib/gemini";
import type {
  TransformRequest,
  TransformResponseError,
  TransformResponseOk,
} from "./types";

// El handler corre en Node (no edge) porque @google/genai usa APIs de Node.
export const runtime = "nodejs";
// La ruta no se cachea: cada request es único.
export const dynamic = "force-dynamic";

// ── Rate limit ──────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface RateBucket {
  count: number;
  resetAt: number;
}

// In-memory map. En una app con multiple instancias o serverless puro
// (cold start frecuente) esto se reinicia, pero alcanza para frenar abuso
// trivial. Para algo serio: Redis / Upstash / Vercel KV.
const buckets = new Map<string, RateBucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
  return NextResponse.json<TransformResponseError>(
    { error: message },
    { status },
  );
}

function parseDataUrl(
  dataUrl: string,
): { mime: string; base64: string } | null {
  const match = dataUrl.match(/^data:([\w/+\-.]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError(
      "Demasiados retratos en poco tiempo. Esperá un minuto antes de probar de nuevo.",
      429,
    );
  }

  let body: Partial<TransformRequest>;
  try {
    body = await req.json();
  } catch {
    return jsonError("El cuerpo del request no es JSON válido.", 400);
  }

  // Validación de schema
  if (!body.image || typeof body.image !== "string") {
    return jsonError("Falta la imagen.", 400);
  }
  if (
    !body.characterId ||
    typeof body.characterId !== "string"
  ) {
    return jsonError("Falta el personaje.", 400);
  }
  if (
    !body.gender ||
    (body.gender !== "dama" && body.gender !== "caballero")
  ) {
    return jsonError("Falta el género (dama o caballero).", 400);
  }

  const character = getCharacterById(body.characterId);
  if (!character) {
    return jsonError(`Personaje desconocido: ${body.characterId}.`, 400);
  }

  const parsed = parseDataUrl(body.image);
  if (!parsed) {
    return jsonError(
      "La imagen no parece estar codificada correctamente.",
      400,
    );
  }
  if (!parsed.mime.startsWith("image/")) {
    return jsonError("El archivo enviado no es una imagen.", 400);
  }

  const prompt = getPrompt(character, body.gender);

  const startedAt = Date.now();
  try {
    const result = await transformPortrait(
      parsed.base64,
      parsed.mime,
      prompt,
    );
    // Sólo metadata, nunca el contenido.
    console.log(
      `[transform] OK character=${body.characterId} gender=${body.gender} latency=${Date.now() - startedAt}ms`,
    );
    return NextResponse.json<TransformResponseOk>({ image: result.imageDataUrl });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error(
        `[transform] GeminiError character=${body.characterId} status=${err.statusHint} message="${err.message}"`,
        err.cause,
      );
      return jsonError(err.message, err.statusHint);
    }
    console.error("[transform] Unexpected error:", err);
    return jsonError("Hubo un error inesperado generando el retrato.", 500);
  }
}
