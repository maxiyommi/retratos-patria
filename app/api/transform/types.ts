/*
 * types.ts — contrato compartido entre el cliente y /api/transform.
 *
 * Se importa tanto desde components/AppFlow (cliente) como desde route.ts
 * (servidor). Mantener este archivo como única fuente de verdad del shape
 * del request/response.
 */

import type { CharacterId } from "@/lib/characters";
import type { Gender } from "@/components/GenderToggle";

export interface TransformRequest {
  /** Foto del usuario como dataURL (data:image/jpeg;base64,...). */
  image: string;
  characterId: CharacterId;
  gender: Gender;
}

export interface TransformResponseOk {
  /** Retrato generado como dataURL listo para mostrar en <img>. */
  image: string;
}

export interface TransformResponseError {
  /** Mensaje apto para mostrar al usuario, en español rioplatense. */
  error: string;
}

export type TransformResponse = TransformResponseOk | TransformResponseError;
