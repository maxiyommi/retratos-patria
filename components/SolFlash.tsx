"use client";

/*
 * SolFlash — destello dorado radial al cambiar de step.
 *
 * Cuando cambia el step, el padre pasa un nuevo `trigger` y este
 * componente renderea un flash overlay que crece y se desvanece
 * en ~720ms. Da feel de transición "lit lantern" entre habitaciones
 * del flujo — la identidad argentina aparece como acento en cada
 * cambio, sin estar permanentemente decorando.
 */

import { useEffect, useState } from "react";
import styles from "./SolFlash.module.css";

export interface SolFlashProps {
  trigger: string | number | null;
}

export function SolFlash({ trigger }: SolFlashProps) {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (!trigger) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKey(String(trigger) + ":" + Date.now());
    const t = window.setTimeout(() => setKey(null), 750);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (!key) return null;
  return <div className={styles.flash} key={key} aria-hidden />;
}
