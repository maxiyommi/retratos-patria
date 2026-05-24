/*
 * analytics.ts — wrapper tipado sobre @vercel/analytics.
 *
 * Centralizamos todos los eventos custom acá para que:
 *   - cada call site sea de una sola línea y tipo-segura
 *   - los nombres y propiedades estén versionados en un solo archivo
 *   - sea trivial declarar los eventos exactamente como se mandan en
 *     content/terminos.md (sin sorpresas para el usuario)
 *
 * Nada de PII jamás: solo enums conocidos (characterId, gender, error_type)
 * y métricas técnicas (latency_ms). Los mensajes de error completos se
 * categorizan a "error_type" antes de enviarse.
 *
 * En dev (next dev) @vercel/analytics no emite eventos; solo en
 * producción de Vercel. Ver app/layout.tsx.
 */

import { track } from "@vercel/analytics";

type CharacterId =
  | "porteno"
  | "patriota"
  | "vendedor"
  | "patricio"
  | "gaucho"
  | "aguatero";

type Gender = "dama" | "caballero";

type ErrorType =
  | "rate_limit"
  | "quota_blocked"
  | "timeout"
  | "payload_too_large"
  | "api_error"
  | "network_error"
  | "unknown";

export const analytics = {
  characterSelected(character: CharacterId) {
    track("character_selected", { character });
  },
  genderSelected(gender: Gender) {
    track("gender_selected", { gender });
  },
  portraitSuccess(args: {
    character: CharacterId;
    gender: Gender;
    latency_ms: number;
  }) {
    track("portrait_success", {
      character: args.character,
      gender: args.gender,
      latency_ms: args.latency_ms,
    });
  },
  portraitFailed(args: {
    error_type: ErrorType;
    character?: CharacterId;
    gender?: Gender;
  }) {
    track("portrait_failed", {
      error_type: args.error_type,
      character: args.character ?? "unknown",
      gender: args.gender ?? "unknown",
    });
  },
  portraitDownloaded(character: CharacterId) {
    track("portrait_downloaded", { character });
  },
  portraitShared(character: CharacterId) {
    track("portrait_shared", { character });
  },
  quotaBlocked() {
    track("quota_blocked");
  },
};

/**
 * Categoriza un error de fetch del cliente a uno de los enums de
 * `error_type`. Usado por portraitFailed.
 */
export function categorizeError(args: {
  status?: number;
  isAbort?: boolean;
  userCancelled?: boolean;
  errorMessage?: string;
}): ErrorType {
  if (args.userCancelled) return "unknown"; // no es un fallo
  if (args.isAbort) return "timeout";
  if (args.status === 429) return "rate_limit";
  if (args.status === 413) return "payload_too_large";
  if (args.status && args.status >= 500) return "api_error";
  if (args.status && args.status >= 400) return "api_error";
  const msg = args.errorMessage?.toLowerCase() ?? "";
  if (msg.includes("network") || msg.includes("failed to fetch"))
    return "network_error";
  return "unknown";
}
