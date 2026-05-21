"use client";

/*
 * RayBurst — celebración cuando llega el retrato.
 *
 * 16 rayos dorados emergen desde un punto central (la sombra detrás del
 * PortraitFrame), se expanden hacia afuera y se desvanecen. Single-shot,
 * ~900ms. Cita visual al Sol de Mayo sin volver a dibujarlo: son los
 * rayos abstraídos, como una resonancia de identidad sobre el retrato
 * que acaba de aparecer.
 *
 * Se monta/desmonta vía la prop `trigger` (cualquier valor truthy nuevo
 * dispara una nueva ráfaga). El padre lo coloca posicionado en absoluto
 * detrás del PortraitFrame con overflow: visible.
 */

import { useEffect, useState } from "react";
import styles from "./RayBurst.module.css";

export interface RayBurstProps {
  /** Cambiar este valor dispara una nueva ráfaga (single-shot). */
  trigger: string | number | null | undefined;
}

const RAY_COUNT = 16;

export function RayBurst({ trigger }: RayBurstProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const key = String(trigger);
    // Patrón legítimo: derivar estado de una prop "trigger" para correr
    // una animación one-shot. La regla react-hooks/set-state-in-effect
    // está pensada para otro caso (loops de cascade renders).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveKey(key);
    const timeout = window.setTimeout(() => setActiveKey(null), 1100);
    return () => window.clearTimeout(timeout);
  }, [trigger]);

  if (!activeKey) return null;

  return (
    <div className={styles.root} aria-hidden key={activeKey}>
      {Array.from({ length: RAY_COUNT }).map((_, i) => (
        <span
          key={i}
          className={styles.ray}
          style={{
            ["--ray-angle" as string]: `${(i * 360) / RAY_COUNT}deg`,
            ["--ray-delay" as string]: `${i * 18}ms`,
          }}
        />
      ))}
    </div>
  );
}
