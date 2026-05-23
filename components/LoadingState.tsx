"use client";

/*
 * LoadingState — "El artista está pintando tu retrato".
 *
 * Vive en el mundo 1810 (pergamino, sepia, dorado) porque está, narrativa-
 * mente, dentro del marco que se está formando. El componente ocupa el
 * mismo espacio cuadrado que ocuparía el PortraitFrame y, cuando Gemini
 * devuelve, hace una transición visual al PortraitFrame real.
 *
 * Decisión estética: **pinceladas de óleo celeste y blanco**. Cada path es
 * un brochazo CERRADO con forma TAPERED (afilada en los extremos, más
 * ancha al medio) — silueta de pincelada de óleo real, no stroke uniforme.
 * Sin filtros SVG por arriba: las curvas Bezier ya dan el carácter de
 * pincelada y el filter feTurbulence + feDisplacementMap se eliminó
 * porque era el mayor costo de GPU del flujo (re-evaluación 60 fps × 5s).
 *
 * Coreografía: pinceladas se revelan vía SVG mask (rect que crece de
 * izq a der scaleX 0→1), staggered 0/0.65/1.3/2.0s. Salpicaduras
 * aparecen con pop scale. Total ~7s, después loop sutil con la cabeza
 * del pincel pulsando.
 *
 * Los mensajes textuales rotan cada 2.8s siguiendo el proceso real de un
 * retratista (preparar bastidor → mezclar pigmentos → mojar pinceles →
 * trazar rasgos → pátina del tiempo → firma). Son INFORMACIÓN, no
 * decoración: siguen rotando incluso con prefers-reduced-motion activo.
 */

import { useEffect, useState } from "react";
import styles from "./LoadingState.module.css";

export interface LoadingStateProps {
  characterName: string;
}

const MESSAGES = [
  "Preparando el bastidor…",
  "Mezclando los pigmentos…",
  "Mojando los pinceles…",
  "Trazando los rasgos…",
  "Aplicando la pátina del tiempo…",
  "Firmando con el Sol de la Patria…",
];

const MESSAGE_INTERVAL_MS = 2800;

/*
 * Pinceladas: paths CERRADOS con forma tapered. Cada path es una pincelada
 * única — sin simetría forzada, levemente curvada, con bordes que el filtro
 * feTurbulence va a desordenar para dar textura de óleo.
 */
type StrokeDef = {
  d: string;
  color: "celeste" | "blanco";
  delay: number;
  maskId: string;
};

const STROKES: StrokeDef[] = [
  {
    // Franja superior — CELESTE, cubre de y≈-92 a y≈-34
    d: "M -94 -90 Q -50 -95, 0 -92 Q 50 -94, 94 -88 Q 96 -75, 92 -50 Q 94 -42, 90 -36 Q 50 -33, 0 -34 Q -50 -36, -90 -34 Q -94 -42, -92 -55 Q -96 -75, -94 -90 Z",
    color: "celeste",
    delay: 0,
    maskId: "reveal-0",
  },
  {
    // Franja del medio — BLANCO, cubre de y≈-30 a y≈30
    d: "M -94 -28 Q -50 -32, 0 -30 Q 50 -32, 94 -26 Q 96 -10, 92 0 Q 94 12, 92 24 Q 94 28, 90 30 Q 50 32, 0 30 Q -50 32, -90 30 Q -94 24, -92 10 Q -96 -10, -94 -28 Z",
    color: "blanco",
    delay: 1.1,
    maskId: "reveal-1",
  },
  {
    // Franja inferior — CELESTE, cubre de y≈34 a y≈92
    d: "M -94 36 Q -50 32, 0 34 Q 50 32, 94 38 Q 96 50, 92 75 Q 94 85, 90 90 Q 50 95, 0 92 Q -50 94, -90 90 Q -94 80, -92 60 Q -96 45, -94 36 Z",
    color: "celeste",
    delay: 2.2,
    maskId: "reveal-2",
  },
];

// Sin salpicaduras: las tres franjas cubren casi todo el lienzo y
// cualquier mancha al medio quedaría tapada. El foco es la bandera.

export function LoadingState({ characterName }: LoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className={styles.intro}>
        Pintando tu retrato como <em>{characterName}</em>…
      </p>

      <div className={styles.canvas}>
        <div className={styles.paper} aria-hidden />
        <svg
          viewBox="-100 -100 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.paint}
          aria-hidden
        >
          <defs>
            {/*
             * Antes había un filtro feTurbulence + feDisplacementMap que
             * rompía los bordes para dar feel de óleo sobre lienzo. Se
             * sacó porque al combinarse con las masks animadas (revealRect
             * scaleX 0→1) el filter se re-evaluaba a 60fps durante 5s,
             * con la GPU al 100% en iPhone — un costo enorme por un
             * detalle estético que casi no se percibe. Los paths ya
             * tienen forma irregular en su `d=`, lo que alcanza para
             * sostener el carácter de pincelada.
             *
             * Una mask por pincelada: rect que crece scaleX 0→1 desde el
             * extremo izquierdo, simulando que un pincel pasa de izq a der.
             */}
            {STROKES.map((s) => (
              <mask key={s.maskId} id={s.maskId}>
                <rect
                  x="-100"
                  y="-100"
                  width="200"
                  height="200"
                  fill="white"
                  className={styles.revealRect}
                  style={{ animationDelay: `${s.delay}s` }}
                />
              </mask>
            ))}
          </defs>

          {/* Tres franjas de la bandera — celeste / blanco / celeste —
              pintadas a brochazo ancho de izq a der, una detrás de otra. */}
          <g>
            {STROKES.map((s, i) => (
              <path
                key={`stroke-${i}`}
                className={`${styles.stroke} ${
                  s.color === "celeste" ? styles.colCeleste : styles.colBlanco
                }`}
                d={s.d}
                mask={`url(#${s.maskId})`}
              />
            ))}
          </g>
        </svg>

        <div className={styles.shimmer} aria-hidden />
      </div>

      <div className={styles.messageWrap}>
        <p key={messageIndex} className={styles.message}>
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Texto sólo para lectores de pantalla: estado completo. */}
      <span className={styles.srOnly}>
        Pintando tu retrato como {characterName}. {MESSAGES[messageIndex]}
      </span>
    </div>
  );
}
