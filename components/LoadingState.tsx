"use client";

/*
 * LoadingState — "El artista está pintando tu retrato".
 *
 * Vive en el mundo 1810 (pergamino, sepia, dorado) porque está, narrativa-
 * mente, dentro del marco que se está formando. El componente ocupa el
 * mismo espacio cuadrado que ocuparía el PortraitFrame y, cuando Gemini
 * devuelve, hace una transición visual al PortraitFrame real.
 *
 * Decisión estética: **Sol de Mayo bordándose**. Los 16 rayos aparecen uno
 * a uno como hilos de oro siendo cosidos sobre el lienzo, en orden clockwise
 * (alternando recto/ondulado). Tarda ~8 segundos en completarse. Después
 * el sol "respira" indefinidamente con un pulse muy sutil, así si Gemini
 * tarda más (8-15s normalmente), el usuario no ve un loop obvio.
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
  /** Si está definido, se muestra un botón "Cancelar" debajo de los mensajes. */
  onCancel?: () => void;
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

// 16 rayos en orden clockwise, intercalando recto y ondulado.
type RayDef = { type: "straight" | "wavy"; angle: number };
const RAYS_ORDERED: RayDef[] = [];
for (let i = 0; i < 8; i++) {
  RAYS_ORDERED.push({ type: "straight", angle: i * 45 });
  RAYS_ORDERED.push({ type: "wavy", angle: i * 45 + 22.5 });
}

const RAY_STAGGER_S = 0.42;

export function LoadingState({ characterName, onCancel }: LoadingStateProps) {
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
          className={styles.sol}
          aria-hidden
        >
          <g className={styles.solGroup}>
            {RAYS_ORDERED.map((ray, i) => (
              <g
                key={`${ray.type}-${ray.angle}`}
                transform={`rotate(${ray.angle})`}
              >
                {ray.type === "straight" ? (
                  <polygon
                    className={styles.ray}
                    style={{ animationDelay: `${i * RAY_STAGGER_S}s` }}
                    points="-6,-50 6,-50 0,-95"
                  />
                ) : (
                  <path
                    className={styles.ray}
                    style={{ animationDelay: `${i * RAY_STAGGER_S}s` }}
                    d="M-4,-50 Q 0,-65 -3,-78 Q 0,-90 4,-50 Z"
                  />
                )}
              </g>
            ))}
            <circle className={styles.disc} r="38" />
            <circle className={styles.discRing} r="38" />
          </g>
        </svg>

        <div className={styles.shimmer} aria-hidden />
      </div>

      <div className={styles.messageWrap}>
        <p key={messageIndex} className={styles.message}>
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {onCancel && (
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancelar
        </button>
      )}

      {/* Texto sólo para lectores de pantalla: estado completo. */}
      <span className={styles.srOnly}>
        Pintando tu retrato como {characterName}. {MESSAGES[messageIndex]}
      </span>
    </div>
  );
}
