"use client";

/*
 * PortraitFrame — el "héroe" visual de Retratos de la Patria.
 *
 * Esto es lo único que entra al "mundo 1810" del CLAUDE.md: dorado, sepia
 * y pergamino. El resto de la app vive en el chrome celeste. La frontera
 * entre los dos mundos se ve y se siente: el marco es un objeto antiguo
 * apoyado sobre la app moderna, con su sombra propia.
 *
 * Stack visual de arriba hacia abajo:
 *   1. Marco dorado con esquinas trabajadas y la imagen detrás del "vidrio".
 *   2. Cartela tipo placa de museo con el nombre del personaje.
 *   3. Botones de acción (descargar / compartir) — ya en chrome celeste.
 *
 * Variantes:
 *   - "cabildo"   (default) — austera, despacho colonial, líneas finas.
 *   - "recoleta"  — ornamentada, mausoleo barroco, palmetas y badge 1810.
 */

import type { CSSProperties } from "react";
import styles from "./PortraitFrame.module.css";

type Variant = "cabildo" | "recoleta";

export interface PortraitFrameProps {
  imageDataUrl: string;
  characterName: string;
  variant?: Variant;
  onDownload: () => void;
  onShare: () => void;
}

export function PortraitFrame({
  imageDataUrl,
  characterName,
  variant = "cabildo",
  onDownload,
  onShare,
}: PortraitFrameProps) {
  const isRecoleta = variant === "recoleta";

  return (
    <div className={styles.root} data-variant={variant}>
      <figure className={styles.frame} aria-label={`Retrato de ${characterName}`}>
        <div className={styles.bevelOuter} aria-hidden />

        {/* Esquinas ornamentales */}
        <Corner position="tl" variant={variant} />
        <Corner position="tr" variant={variant} />
        <Corner position="bl" variant={variant} />
        <Corner position="br" variant={variant} />

        <div className={styles.mat}>
          {isRecoleta && <div className={styles.matPinstripe} aria-hidden />}
          <div className={styles.imageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={`Retrato de ${characterName}, pintado al óleo`}
              className={styles.image}
              draggable={false}
            />
            <div className={styles.glassSheen} aria-hidden />
          </div>
        </div>

        <figcaption className={styles.cartela}>
          <span className={styles.cartelaName}>{characterName}</span>
          {isRecoleta && (
            <span className={styles.cartelaBadge} aria-hidden>
              Anno <em>1810</em>
            </span>
          )}
        </figcaption>
      </figure>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionPrimary}`}
          onClick={onDownload}
        >
          <DownloadIcon />
          <span>Descargar</span>
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onShare}
        >
          <ShareIcon />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
}

/* ── Subcomponentes internos ─────────────────────────────────────────── */

function Corner({
  position,
  variant,
}: {
  position: "tl" | "tr" | "bl" | "br";
  variant: Variant;
}) {
  // Rotación según esquina para que el motivo apunte "hacia adentro".
  const rotations: Record<typeof position, number> = {
    tl: 0,
    tr: 90,
    br: 180,
    bl: 270,
  };
  const style = {
    transform: `rotate(${rotations[position]}deg)`,
  } as CSSProperties;

  return (
    <span
      className={`${styles.corner} ${styles[`corner-${position}` as const]}`}
      aria-hidden
    >
      {variant === "cabildo" ? (
        <RosetonCabildo style={style} />
      ) : (
        <PalmetaRecoleta style={style} />
      )}
    </span>
  );
}

function RosetonCabildo({ style }: { style: CSSProperties }) {
  // Rosetón austero: 4 pétalos en cruz + 4 más chicos en diagonal + centro.
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={styles.cornerSvg}
      aria-hidden
    >
      <g fill="currentColor">
        <ellipse cx="16" cy="6.5" rx="2.4" ry="4.5" />
        <ellipse cx="25.5" cy="16" rx="4.5" ry="2.4" />
        <ellipse cx="16" cy="25.5" rx="2.4" ry="4.5" />
        <ellipse cx="6.5" cy="16" rx="4.5" ry="2.4" />
        <ellipse
          cx="9.5"
          cy="9.5"
          rx="2.6"
          ry="1.6"
          transform="rotate(45 9.5 9.5)"
          opacity="0.85"
        />
        <ellipse
          cx="22.5"
          cy="9.5"
          rx="2.6"
          ry="1.6"
          transform="rotate(-45 22.5 9.5)"
          opacity="0.85"
        />
        <ellipse
          cx="9.5"
          cy="22.5"
          rx="2.6"
          ry="1.6"
          transform="rotate(-45 9.5 22.5)"
          opacity="0.85"
        />
        <ellipse
          cx="22.5"
          cy="22.5"
          rx="2.6"
          ry="1.6"
          transform="rotate(45 22.5 22.5)"
          opacity="0.85"
        />
        <circle cx="16" cy="16" r="3.2" />
        <circle cx="16" cy="16" r="1.4" fill="rgba(58, 38, 24, 0.5)" />
      </g>
    </svg>
  );
}

function PalmetaRecoleta({ style }: { style: CSSProperties }) {
  // Palmeta barroca: hoja central acanalada + dos volutas a los lados.
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={styles.cornerSvg}
      aria-hidden
    >
      <g fill="currentColor">
        {/* Hoja central */}
        <path d="M24 6 Q 19 18 24 28 Q 29 18 24 6 Z" />
        <path
          d="M24 10 Q 21 20 24 26 Q 27 20 24 10 Z"
          fill="rgba(58, 38, 24, 0.35)"
        />
        {/* Voluta izquierda */}
        <path d="M22 22 Q 12 22 8 30 Q 14 28 17 24 Q 22 24 22 22 Z" />
        {/* Voluta derecha */}
        <path d="M26 22 Q 36 22 40 30 Q 34 28 31 24 Q 26 24 26 22 Z" />
        {/* Base / disco */}
        <circle cx="24" cy="28" r="3.2" />
        <circle cx="24" cy="28" r="1.4" fill="rgba(58, 38, 24, 0.5)" />
        {/* Pequeño remate inferior */}
        <ellipse cx="24" cy="36" rx="6" ry="1.4" opacity="0.7" />
      </g>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v13" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}
