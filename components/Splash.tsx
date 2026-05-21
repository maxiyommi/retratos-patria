"use client";

/*
 * Splash — pantalla de bienvenida con identidad argentina + CTA Ingresar.
 *
 * Ya no se auto-cierra con timer: el usuario controla cuándo entrar a la
 * app tocando "Ingresar". Eso le da el respiro para apreciar la
 * coreografía completa (5s de animaciones escalonadas) sin presión.
 *
 * Composición edge-to-edge:
 *  - El root es position: fixed inset: 0 — cubre debajo del status bar
 *    (en PWA standalone con apple-mobile-web-app-status-bar-style
 *    "black-translucent" el contenido pasa por debajo del status bar).
 *  - La bandera es el fondo (3 franjas celeste/blanco/celeste). Sus
 *    franjas SUPERIOR e INFERIOR son celeste (#5b9ece), matching el
 *    theme-color del meta de Next que controla el color de la URL bar
 *    en Chrome/Safari. Resultado: no hay borde visible entre app y
 *    browser chrome.
 *  - safe-area-inset-top/bottom respetados sólo por el contenido
 *    (Sol/título/botón) y el footer, no por el fondo.
 *
 * Coreografía total: 5 segundos antes de quedar idle.
 *  - 0-1800ms: bandera unfurl + drift perpetuo de 18s.
 *  - 800-2300ms: Sol de Mayo emerge.
 *  - 2200-3600ms: "Retratos" emerge con gradient dorado.
 *  - 2900-3900ms: "de la Patria" emerge.
 *  - 3700-4400ms: botón Ingresar emerge.
 *  - 4300-5000ms: footer emerge.
 *  - 3800ms en adelante: shimmer dorado perpetuo sobre "Retratos".
 *  - Idle: queda como está hasta que el usuario toca Ingresar.
 */

import { useState } from "react";
import { SolDeMayo } from "@/components/SolDeMayo";
import { haptic } from "@/lib/haptic";
import styles from "./Splash.module.css";

const FADE_MS = 800;

export function Splash() {
  const [phase, setPhase] = useState<"showing" | "fading" | "done">(
    "showing",
  );

  function handleIngresar() {
    if (phase !== "showing") return;
    haptic("success");
    setPhase("fading");
    window.setTimeout(() => setPhase("done"), FADE_MS);
  }

  if (phase === "done") return null;

  return (
    <div className={styles.root} data-phase={phase}>
      <svg
        className={styles.flag}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/*
          Bandera limpia sin filtros — tres franjas con bordes nítidos.
          La sensación de "viento" se da con la capa .shine (gradiente
          diagonal que barre por encima) y el .flagBreath (respiración
          sutil de toda la bandera). Sin displacement, sin papel rasgado.
        */}
        <g className={styles.flagUnfurl}>
          <g className={styles.flagBreath}>
            <rect
              x="0"
              y="0"
              width="1200"
              height="267"
              fill="var(--color-celeste)"
            />
            <rect
              x="0"
              y="267"
              width="1200"
              height="266"
              fill="var(--color-blanco-calido)"
            />
            <rect
              x="0"
              y="533"
              width="1200"
              height="267"
              fill="var(--color-celeste)"
            />
          </g>
        </g>
      </svg>

      {/*
        Brillo diagonal que barre la bandera periódicamente. Es lo que da
        sensación de "tela reflejando luz". Pause largo entre pasadas para
        que no sea agresivo.
      */}
      <div className={styles.shine} aria-hidden />

      <div className={styles.vignette} aria-hidden />

      <div className={styles.content}>
        <SolDeMayo className={styles.sun} />
        <h1 className={styles.title}>
          <span className={styles.titleMain}>Retratos</span>
          <span className={styles.titleSub}>de la Patria</span>
        </h1>

        <button
          type="button"
          className={styles.cta}
          onClick={handleIngresar}
          aria-label="Ingresar a la app"
        >
          Ingresar
        </button>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Un proyecto educativo de código abierto
        </p>
        <a
          href="https://github.com/maxiyommi/retratos-patria"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Ver en GitHub
        </a>
      </footer>
    </div>
  );
}
