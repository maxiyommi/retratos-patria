"use client";

/*
 * LoadingState — "El artista está pintando tu retrato".
 *
 * Vive en el mundo 1810 (pergamino, sepia, dorado) porque está, narrativa-
 * mente, dentro del marco que se está formando. El componente ocupa el
 * mismo espacio cuadrado que ocuparía el PortraitFrame y, cuando Gemini
 * devuelve, hace una transición visual al PortraitFrame real.
 *
 * Decisión estética: **pinceladas y manchas de pintura celeste y blanca**.
 * Trazos curvos aparecen uno detrás del otro como si un pincel los estuviera
 * dando sobre el lienzo, en los colores de la Patria (celeste + blanco
 * cálido). Acompañan salpicaduras del mismo pigmento. Total ~7 segundos
 * para completarse y después loopea sutilmente.
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
 * Pinceladas: paths curvos con stroke-linecap round que se "dibujan"
 * uno detrás del otro vía stroke-dasharray animation. El color alterna
 * entre celeste y blanco-cálido formando un patrón visual de bandera.
 */
type StrokeDef = {
  d: string;
  color: "celeste" | "blanco";
  width: number;
  delay: number; // segundos
};

const STROKES: StrokeDef[] = [
  { d: "M -78 -55 Q -18 -78 60 -45", color: "celeste", width: 16, delay: 0 },
  { d: "M -72 -10 Q -8 12 68 -10", color: "blanco", width: 18, delay: 0.6 },
  { d: "M -68 28 Q 8 50 72 22", color: "celeste", width: 16, delay: 1.2 },
  { d: "M -58 62 Q 0 80 58 55", color: "blanco", width: 14, delay: 1.8 },
];

/*
 * Manchas de pintura — salpicaduras pequeñas distribuidas asimétricamente
 * alrededor de las pinceladas. Aparecen con un pop scale + fade.
 */
type SplashDef = {
  cx: number;
  cy: number;
  r: number;
  color: "celeste" | "blanco";
  delay: number;
};

const SPLASHES: SplashDef[] = [
  { cx: -82, cy: -78, r: 5, color: "celeste", delay: 0.15 },
  { cx: 68, cy: -82, r: 6, color: "blanco", delay: 0.45 },
  { cx: -46, cy: -30, r: 3, color: "blanco", delay: 0.75 },
  { cx: 80, cy: 6, r: 4, color: "celeste", delay: 1.15 },
  { cx: -85, cy: 52, r: 5, color: "blanco", delay: 1.55 },
  { cx: 82, cy: 70, r: 4, color: "celeste", delay: 2.05 },
  { cx: -28, cy: 88, r: 3, color: "celeste", delay: 2.45 },
  { cx: 38, cy: 90, r: 5, color: "blanco", delay: 2.75 },
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
          {/* Salpicaduras: van por debajo de las pinceladas */}
          {SPLASHES.map((s, i) => (
            <circle
              key={`splash-${i}`}
              className={`${styles.splash} ${
                s.color === "celeste" ? styles.colCeleste : styles.colBlanco
              }`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
          {/* Pinceladas — paths curvos que se dibujan con stroke-dasharray */}
          {STROKES.map((s, i) => (
            <path
              key={`stroke-${i}`}
              className={`${styles.stroke} ${
                s.color === "celeste" ? styles.colCeleste : styles.colBlanco
              }`}
              d={s.d}
              strokeWidth={s.width}
              pathLength={100}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
          {/* Cabeza del pincel: un círculo dorado-suave que sigue la última
              pincelada al final, como si el pincel se quedara apoyado. */}
          <circle
            className={styles.brushHead}
            cx="58"
            cy="55"
            r="6"
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
