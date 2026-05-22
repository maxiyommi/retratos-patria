"use client";

/*
 * LoadingState — "El artista está pintando tu retrato".
 *
 * Vive en el mundo 1810 (pergamino, sepia, dorado) porque está, narrativa-
 * mente, dentro del marco que se está formando. El componente ocupa el
 * mismo espacio cuadrado que ocuparía el PortraitFrame y, cuando Gemini
 * devuelve, hace una transición visual al PortraitFrame real.
 *
 * Decisión estética: **pinceladas y salpicaduras de óleo celeste y blanco**.
 * Las pinceladas son paths CERRADOS con forma TAPERED (afilada en los
 * extremos, más ancha al medio) — silueta de pincelada de óleo real, no
 * stroke uniforme tipo salchicha. Las salpicaduras son BLOBS IRREGULARES
 * (no círculos perfectos) más gotas satélite chiquitas alrededor. Todo
 * pasa por un filtro SVG de feTurbulence + feDisplacementMap que rompe
 * los bordes, dándole textura de óleo sobre lienzo.
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
    d: "M -78 -55 Q -50 -68, -20 -64 Q 20 -60, 50 -54 Q 62 -50, 60 -45 Q 50 -42, 30 -46 Q 0 -52, -30 -55 Q -60 -56, -78 -55 Z",
    color: "celeste",
    delay: 0,
    maskId: "reveal-0",
  },
  {
    d: "M -75 -15 Q -45 -28, -10 -22 Q 30 -16, 60 -8 Q 72 -4, 68 0 Q 55 4, 30 -1 Q -5 -7, -40 -10 Q -65 -12, -75 -15 Z",
    color: "blanco",
    delay: 0.65,
    maskId: "reveal-1",
  },
  {
    d: "M -72 28 Q -38 18, 0 26 Q 35 33, 65 30 Q 75 32, 72 38 Q 58 42, 30 38 Q -5 32, -40 35 Q -65 35, -72 28 Z",
    color: "celeste",
    delay: 1.3,
    maskId: "reveal-2",
  },
  {
    d: "M -58 62 Q -28 56, 0 60 Q 30 66, 50 64 Q 60 65, 56 70 Q 42 72, 22 70 Q -8 66, -32 67 Q -54 69, -58 62 Z",
    color: "blanco",
    delay: 2.0,
    maskId: "reveal-3",
  },
];

/*
 * Salpicaduras: blobs irregulares (paths) en vez de círculos perfectos,
 * para que parezcan gotas de pintura caídas, no burbujas. Cada uno con
 * su propia forma única generada con makeBlob.
 */
function makeBlob(r: number, seed: number): string {
  // 6 vértices con radios variables (función pseudo-aleatoria con seed),
  // conectados con curvas Bézier cuadráticas también con offset random
  // para que la silueta no sea simétrica.
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const variance = 0.65 + ((Math.sin(seed * 7.13 + i * 2.31) + 1) / 2) * 0.5;
    const rr = r * variance;
    points.push([Math.cos(angle) * rr, Math.sin(angle) * rr]);
  }
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const cur = points[i];
    const cx = (cur[0] + next[0]) / 2 + Math.sin(seed * 3.7 + i) * r * 0.15;
    const cy = (cur[1] + next[1]) / 2 + Math.cos(seed * 3.7 + i) * r * 0.15;
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)}, ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
  }
  d += " Z";
  return d;
}

type SplashDef = {
  cx: number;
  cy: number;
  d: string;
  color: "celeste" | "blanco";
  delay: number;
};

const SPLASHES: SplashDef[] = [
  { cx: -82, cy: -78, d: makeBlob(7, 1), color: "celeste", delay: 0.15 },
  { cx: 70, cy: -82, d: makeBlob(8, 2), color: "blanco", delay: 0.45 },
  { cx: -45, cy: -32, d: makeBlob(4, 3), color: "blanco", delay: 0.75 },
  { cx: 80, cy: 8, d: makeBlob(5, 4), color: "celeste", delay: 1.15 },
  { cx: -85, cy: 52, d: makeBlob(6, 5), color: "blanco", delay: 1.55 },
  { cx: 82, cy: 70, d: makeBlob(5, 6), color: "celeste", delay: 2.05 },
  { cx: -28, cy: 88, d: makeBlob(4, 7), color: "celeste", delay: 2.45 },
  { cx: 40, cy: 90, d: makeBlob(6, 8), color: "blanco", delay: 2.75 },
];

// Gotas satélite chiquitas alrededor de las salpicaduras grandes —
// refuerzan la idea de pintura saltada al pincelar.
const SATELLITES: SplashDef[] = [
  { cx: -70, cy: -88, d: makeBlob(1.4, 11), color: "celeste", delay: 0.3 },
  { cx: 60, cy: -68, d: makeBlob(1.6, 12), color: "blanco", delay: 0.55 },
  { cx: -92, cy: 42, d: makeBlob(1.5, 13), color: "celeste", delay: 1.7 },
  { cx: 72, cy: 82, d: makeBlob(1.3, 14), color: "blanco", delay: 2.2 },
];

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
            {/* Filtro de textura: feTurbulence + feDisplacementMap rompe
                los bordes de cada path dando feel de pincelada irregular
                sobre lienzo rugoso. */}
            <filter
              id="paint-rough"
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.4"
                numOctaves="2"
                seed="5"
              />
              <feDisplacementMap in="SourceGraphic" scale="2.5" />
            </filter>
            {/* Una mask por pincelada — rect que crece scaleX 0→1
                desde el extremo izquierdo, simulando que un pincel
                está pintando de izq a der. */}
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

          {/* Salpicaduras + satélites: van por debajo de las pinceladas */}
          <g filter="url(#paint-rough)">
            {SPLASHES.map((s, i) => (
              <path
                key={`splash-${i}`}
                className={`${styles.splash} ${
                  s.color === "celeste" ? styles.colCeleste : styles.colBlanco
                }`}
                d={s.d}
                transform={`translate(${s.cx} ${s.cy})`}
                style={{ animationDelay: `${s.delay}s` }}
              />
            ))}
            {SATELLITES.map((s, i) => (
              <path
                key={`sat-${i}`}
                className={`${styles.splash} ${
                  s.color === "celeste" ? styles.colCeleste : styles.colBlanco
                }`}
                d={s.d}
                transform={`translate(${s.cx} ${s.cy})`}
                style={{ animationDelay: `${s.delay}s` }}
              />
            ))}
          </g>

          {/* Pinceladas — paths con tapered ends, reveladas con mask. */}
          <g filter="url(#paint-rough)">
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

          {/* Cabeza del pincel: punto dorado-suave que aparece al final
              en la última pincelada, como si el pincel se hubiera
              quedado apoyado. */}
          <circle
            className={styles.brushHead}
            cx="50"
            cy="66"
            r="5"
          />
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
