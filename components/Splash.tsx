"use client";

/*
 * Splash — pantalla de boot estilo app nativa con identidad argentina.
 *
 * Composición:
 *  - Bandera argentina (3 franjas celeste/blanco/celeste) cubriendo todo
 *    el viewport, con efecto de "viento" perpetuo (feTurbulence +
 *    feDisplacementMap).
 *  - Vignette radial sutil que oscurece los bordes y enfoca el centro,
 *    con un halo dorado donde estará el Sol.
 *  - Sol de Mayo en dorado fuerte, centrado, con doble glow.
 *  - Título "Retratos de la Patria" en Cormorant italic.
 *
 * Coreografía (2.8s total + 800ms fade):
 *  1. La bandera "se despliega" desde el centro (scaleX 0 → 1) en 1100ms.
 *     A la vez, comienza el drift perpetuo de 14s que da sensación de
 *     viento sostenido.
 *  2. El Sol de Mayo emerge a los 500ms con scale + rotación + blur-out
 *     durante 1100ms. Después entra en pulse suave perpetuo de 3.2s.
 *  3. El título emerge a los 1500ms con blur-out + translateY durante 1000ms.
 *  4. A los 2800ms empieza el fade out (800ms) hacia el contenido real.
 */

import { useEffect, useState } from "react";
import { SolDeMayo } from "@/components/SolDeMayo";
import styles from "./Splash.module.css";

const SHOW_MS = 2800;
const FADE_MS = 800;

export function Splash() {
  const [phase, setPhase] = useState<"showing" | "fading" | "done">(
    "showing",
  );

  useEffect(() => {
    const startFade = window.setTimeout(
      () => setPhase("fading"),
      SHOW_MS,
    );
    const done = window.setTimeout(
      () => setPhase("done"),
      SHOW_MS + FADE_MS,
    );
    return () => {
      window.clearTimeout(startFade);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className={styles.root} data-phase={phase} aria-hidden>
      <svg
        className={styles.flag}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id="splash-wave"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.045"
              numOctaves="2"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" scale="26" />
          </filter>
        </defs>
        {/* Outer group: unfurl en X. Inner group: drift horizontal perpetuo. */}
        <g className={styles.flagUnfurl}>
          <g className={styles.flagDrift} filter="url(#splash-wave)">
            <rect
              x="-100"
              y="0"
              width="1400"
              height="267"
              fill="var(--color-celeste)"
            />
            <rect
              x="-100"
              y="267"
              width="1400"
              height="266"
              fill="var(--color-blanco-calido)"
            />
            <rect
              x="-100"
              y="533"
              width="1400"
              height="267"
              fill="var(--color-celeste)"
            />
          </g>
        </g>
      </svg>

      <div className={styles.vignette} aria-hidden />

      <div className={styles.content}>
        <SolDeMayo className={styles.sun} />
        <p className={styles.title}>Retratos de la Patria</p>
      </div>
    </div>
  );
}
