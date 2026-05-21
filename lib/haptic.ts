/*
 * haptic.ts — feedback háptico sutil para taps importantes.
 *
 * Usa navigator.vibrate cuando está disponible (Android Chrome, algunos
 * navegadores con permiso explícito). En iOS Safari no funciona desde
 * web — silencioso. Para no ser invasivo: pulsos cortos (10-15ms).
 *
 * Patrones definidos según el "peso" del gesto:
 *   - tap:     toque liviano (selección, botón secundario)
 *   - select:  algo elegido (card de personaje, toggle de género)
 *   - shutter: foto sacada (más contundente)
 *   - success: retrato listo (doble pulso)
 *   - error:   algo falló (pulso más largo)
 */

type HapticPattern = "tap" | "select" | "shutter" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  select: 12,
  shutter: 24,
  success: [12, 40, 18],
  error: 40,
};

export function haptic(pattern: HapticPattern = "tap"): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  // Algunos navegadores requieren interacción previa del usuario. Si no
  // está permitido, vibrate devuelve false silenciosamente.
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Ignorar: el haptic feedback es bonus, nunca crítico.
  }
}
