/*
 * quota.ts — cuota soft de retratos por dispositivo.
 *
 * Se persiste en localStorage. El usuario puede esquivarla borrando el
 * storage o usando un navegador en incógnito; eso es aceptable: el
 * espíritu es frenar el abuso casual en una app educativa, no implementar
 * un anti-bot serio. El rate-limit del servidor (5/min por IP) cubre el
 * lado "abuso real".
 *
 * Versionada: si en el futuro cambia el límite o la lógica, bumpear la
 * key para resetear contadores viejos.
 */

const QUOTA_KEY = "retratos_count_v1";
export const MAX_PORTRAITS_PER_DEVICE = 4;

export function getPortraitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(QUOTA_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function getPortraitsRemaining(): number {
  return Math.max(0, MAX_PORTRAITS_PER_DEVICE - getPortraitCount());
}

export function incrementPortraitCount(): number {
  const next = getPortraitCount() + 1;
  try {
    window.localStorage.setItem(QUOTA_KEY, String(next));
  } catch {
    // ignoramos: si el storage falla, perdemos el conteo pero el flow
    // sigue funcionando.
  }
  return next;
}

export function hasQuotaLeft(): boolean {
  return getPortraitCount() < MAX_PORTRAITS_PER_DEVICE;
}
