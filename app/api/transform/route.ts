/*
 * /api/transform — recibe la foto del usuario + selección de personaje,
 * llama a Gemini, devuelve el retrato pintado.
 *
 * Validaciones:
 *   - Cota de tamaño del body antes de parsear (evita DoS por payload gigante).
 *   - Rate limit simple in-memory por IP (5 requests / minuto).
 *   - Validación de schema del body: characterId contra enum estricto,
 *     gender válido, image como dataURL con MIME image/*.
 *   - Los mensajes de error van en español rioplatense, aptos para mostrar
 *     al usuario directamente. NO reflejan el input del cliente.
 *
 * Lo que NUNCA hace:
 *   - Persistir la foto recibida.
 *   - Persistir el retrato generado.
 *   - Loguear el contenido de las imágenes (sólo metadata: bytes,
 *     character, latencia).
 *   - Devolver al cliente el stack trace ni info interna del SDK.
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
// Cota de entradas en el map para evitar leak de memoria si la instancia
// vive mucho tiempo en presencia de tráfico desde muchas IPs.
const BUCKETS_MAX = 10_000;

interface RateBucket {
  count: number;
  resetAt: number;
}

// In-memory map. En serverless puro (cold start frecuente) se reinicia,
// pero alcanza para frenar abuso trivial. Para algo serio: Redis / Upstash /
// Vercel KV.
const buckets = new Map<string, RateBucket>();

/**
 * Resuelve la IP del cliente con un orden de preferencia que evita el
 * spoofing trivial vía X-Forwarded-For. En Vercel, x-vercel-forwarded-for
 * y x-real-ip son inyectados por el edge y NO son seteables por el cliente.
 * X-Forwarded-For sí es spoofeable; lo usamos sólo como último fallback
 * para entornos no-Vercel.
 */
function getClientIp(req: NextRequest): string {
  const vercelFwd = req.headers.get("x-vercel-forwarded-for");
  if (vercelFwd) return vercelFwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Limpieza oportunista cuando el map se infla. Al cap, dropeamos el
  // map entero — los buckets "perdidos" sólo significan que algunos
  // usuarios recuperan su cuota un poco antes; aceptable.
  if (buckets.size > BUCKETS_MAX) {
    buckets.clear();
  }

  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

// ── Constantes de validación ────────────────────────────────────────────

// Set explícito de characterId aceptados. Mantener sincronizado con
// lib/characters.ts.
const VALID_CHARACTER_IDS = new Set<string>([
  "porteno",
  "patriota",
  "vendedor",
  "patricio",
  "gaucho",
  "aguatero",
]);

// Cota de tamaño del body (en bytes). El cliente reduce a ~1024px máx con
// calidad 0.82, lo que rara vez supera 800 KB. 8 MB cubre con holgura
// imágenes legítimas y rechaza ataques de payload gigante.
const MAX_BODY_BYTES = 8 * 1024 * 1024;

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
  // Cota de tamaño antes de leer el body en memoria.
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError(
      "La imagen es demasiado grande. Sacá una nueva o subí otra más liviana.",
      413,
    );
  }

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
  // Doble check post-parseo (content-length puede estar ausente o mal seteado).
  if (body.image.length > MAX_BODY_BYTES) {
    return jsonError(
      "La imagen es demasiado grande. Sacá una nueva o subí otra más liviana.",
      413,
    );
  }
  if (
    !body.characterId ||
    typeof body.characterId !== "string" ||
    !VALID_CHARACTER_IDS.has(body.characterId)
  ) {
    // No reflejamos el valor recibido en el mensaje — evita echo del input.
    return jsonError("Personaje inválido.", 400);
  }
  if (
    !body.gender ||
    (body.gender !== "dama" && body.gender !== "caballero")
  ) {
    return jsonError("Falta el género (dama o caballero).", 400);
  }

  const character = getCharacterById(body.characterId);
  if (!character) {
    // Inalcanzable después de la validación de enum arriba.
    return jsonError("Personaje inválido.", 400);
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
    // Sólo metadata, nunca el contenido de la imagen.
    console.log(
      `[transform] OK character=${body.characterId} gender=${body.gender} latency=${Date.now() - startedAt}ms`,
    );
    return NextResponse.json<TransformResponseOk>({ image: result.imageDataUrl });
  } catch (err) {
    if (err instanceof GeminiError) {
      // Logueamos sólo el mensaje del cause (no el objeto entero — evita
      // que stack traces con paths internos lleguen al log de Vercel).
      const causeMessage =
        err.cause instanceof Error ? err.cause.message : undefined;
      console.error(
        `[transform] GeminiError character=${body.characterId} status=${err.statusHint} message="${err.message}"${
          causeMessage ? ` cause="${causeMessage}"` : ""
        }`,
      );
      return jsonError(err.message, err.statusHint);
    }
    // Error inesperado: logueamos sólo el message, no el stack ni el objeto.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[transform] Unexpected error: ${message}`);
    return jsonError("Hubo un error inesperado generando el retrato.", 500);
  }
}
