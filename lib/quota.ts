/*
 * quota.ts — cuota soft de retratos por dispositivo, por día.
 *
 * La ventana es diaria (calendario local del dispositivo): cuando cambia
 * el día local, el contador se resetea automáticamente. Esto permite que
 * un alumno vuelva a probar la app al día siguiente sin quedar bloqueado
 * permanentemente, manteniendo el cap razonable contra el abuso.
 *
 * Es soft: el usuario puede esquivarla borrando localStorage o usando un
 * navegador en incógnito. Eso es aceptable: el espíritu es frenar el
 * abuso casual en una app educativa, no implementar un anti-bot serio.
 * El rate-limit del servidor (5/min por IP) cubre el lado "abuso real".
 *
 * El storage guarda { date: "YYYY-MM-DD", count: N } como JSON. Si la
 * fecha guardada difiere de "hoy", se considera 0.
 *
 * Versionada: si en el futuro cambia el límite o la lógica, bumpear la
 * key para resetear contadores viejos.
 */

const QUOTA_KEY = "retratos_count_daily_v1";
export const MAX_PORTRAITS_PER_DAY = 4;

interface QuotaRecord {
  date: string;
  count: number;
}

/** Devuelve la fecha local en formato YYYY-MM-DD. */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readRecord(): QuotaRecord {
  if (typeof window === "undefined") return { date: today(), count: 0 };
  try {
    const raw = window.localStorage.getItem(QUOTA_KEY);
    if (!raw) return { date: today(), count: 0 };
    const parsed = JSON.parse(raw) as Partial<QuotaRecord>;
    if (
      typeof parsed.date !== "string" ||
      typeof parsed.count !== "number" ||
      !Number.isFinite(parsed.count) ||
      parsed.count < 0
    ) {
      return { date: today(), count: 0 };
    }
    // Si el día cambió, ignoramos el contador viejo (se reseteará al
    // próximo writeRecord).
    if (parsed.date !== today()) return { date: today(), count: 0 };
    return { date: parsed.date, count: parsed.count };
  } catch {
    return { date: today(), count: 0 };
  }
}

function writeRecord(record: QuotaRecord): void {
  try {
    window.localStorage.setItem(QUOTA_KEY, JSON.stringify(record));
  } catch {
    // Ignoramos: si el storage falla, perdemos el conteo pero el flow
    // sigue funcionando.
  }
}

export function getPortraitCount(): number {
  return readRecord().count;
}

export function getPortraitsRemaining(): number {
  return Math.max(0, MAX_PORTRAITS_PER_DAY - getPortraitCount());
}

export function incrementPortraitCount(): number {
  const record = readRecord();
  const next: QuotaRecord = {
    date: today(),
    count: record.count + 1,
  };
  writeRecord(next);
  return next.count;
}

export function hasQuotaLeft(): boolean {
  return getPortraitCount() < MAX_PORTRAITS_PER_DAY;
}
