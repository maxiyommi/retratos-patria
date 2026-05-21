"use client";

/*
 * Splash — pantalla de boot estilo app nativa.
 *
 * Aparece durante los primeros ~1.4s después de hidratar el cliente.
 * Muestra el Sol de Mayo + título sobre fondo celeste, con un pequeño
 * "fade out" hacia el contenido real. Imita la sensación de "abrir una
 * app instalada" en iOS / Android (a pesar de que la app es PWA, esto
 * refuerza el feel nativo).
 *
 * Se renderiza UNA sola vez por sesión, no entre pasos. Una vez fade
 * out completo, se desmonta para no quedar en el DOM.
 */

import { useEffect, useState } from "react";
import { SolDeMayo } from "@/components/SolDeMayo";
import styles from "./Splash.module.css";

const SPLASH_DURATION_MS = 1200;

export function Splash() {
  const [phase, setPhase] = useState<"showing" | "fading" | "done">("showing");

  useEffect(() => {
    const startFade = window.setTimeout(
      () => setPhase("fading"),
      SPLASH_DURATION_MS,
    );
    const done = window.setTimeout(
      () => setPhase("done"),
      SPLASH_DURATION_MS + 600,
    );
    return () => {
      window.clearTimeout(startFade);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={styles.root}
      data-phase={phase}
      aria-hidden
    >
      <SolDeMayo className={styles.sun} />
      <p className={styles.title}>Retratos de la Patria</p>
    </div>
  );
}
