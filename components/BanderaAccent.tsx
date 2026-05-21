/*
 * BanderaAccent — franja celeste / blanco / celeste sutil con onda.
 *
 * Es la composición literal de la bandera argentina (los tres campos
 * horizontales sin el sol), animada con una distorsión SVG suave para
 * sugerir viento sin caer en kitsch. Se renderiza fija en el borde
 * inferior del viewport, decorativa.
 *
 * Se sienta detrás del contenido (z-index negativo) y respeta safe-area.
 * Para usuarios con prefers-reduced-motion, la onda se desactiva.
 */

import styles from "./BanderaAccent.module.css";

export function BanderaAccent() {
  return (
    <div className={styles.root} aria-hidden>
      <svg
        className={styles.svg}
        viewBox="0 0 600 30"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="bandera-wave" x="-2%" y="-50%" width="104%" height="200%">
            {/* Turbulencia que se mueve horizontalmente — el desplazamiento
                lo anima la CSS sobre el feOffset. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.06"
              numOctaves="2"
              seed="3"
            />
            <feDisplacementMap in="SourceGraphic" scale="2.4" />
          </filter>
        </defs>
        <g filter="url(#bandera-wave)" className={styles.banderaGroup}>
          <rect x="0" y="0" width="600" height="10" fill="var(--color-celeste)" />
          <rect x="0" y="10" width="600" height="10" fill="var(--color-blanco-calido)" />
          <rect x="0" y="20" width="600" height="10" fill="var(--color-celeste)" />
        </g>
      </svg>
    </div>
  );
}
