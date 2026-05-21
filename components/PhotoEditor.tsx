"use client";

/*
 * PhotoEditor — editor de encuadre para fotos subidas desde galería.
 *
 * Cuando el usuario sube una foto en lugar de capturarla con la cámara
 * en vivo, no tuvo oportunidad de encuadrarla con el óvalo guía. Este
 * componente abre la foto en un viewport 1:1 con el mismo óvalo
 * superpuesto y deja:
 *   - arrastrar para reposicionar (pointer events, mouse + touch),
 *   - pinch para zoom (dos dedos),
 *   - wheel para zoom (desktop),
 *   - botones +/- como fallback accesible.
 *
 * Al confirmar, recortamos el rectángulo 1:1 visible del source image
 * a tamaño máximo 1024px (mismo objetivo que resizeImage) y devolvemos
 * el dataURL JPEG comprimido.
 *
 * No usamos editor para snapshots de la cámara en vivo — ahí el usuario
 * ya encuadró con el óvalo durante la captura.
 */

import { useEffect, useRef, useState } from "react";
import { ImageProcessingError } from "@/lib/image";
import { haptic } from "@/lib/haptic";
import styles from "./PhotoEditor.module.css";

const OUTPUT_MAX_SIZE = 1024;
const JPEG_QUALITY = 0.85;
const MAX_SCALE_MULTIPLIER = 4; // hasta 4x del cover inicial

export interface PhotoEditorProps {
  /** dataURL del archivo subido (sin procesar). */
  imageDataUrl: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

interface Bounds {
  minScale: number;
  maxScale: number;
}

export function PhotoEditor({
  imageDataUrl,
  onConfirm,
  onCancel,
}: PhotoEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [vpSize, setVpSize] = useState(0);
  const [transform, setTransform] = useState<Transform>({
    tx: 0,
    ty: 0,
    scale: 1,
  });
  const [error, setError] = useState<string | null>(null);

  // Pointers activos para drag y pinch.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(
    null,
  );

  // Tomamos la medida del viewport (cuadrado) y la mantenemos sincronizada.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setVpSize(el.clientWidth);
    });
    ro.observe(el);
    setVpSize(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Cuando la imagen carga, calculamos el transform inicial (cover) y centramos.
  function handleImageLoad() {
    const img = imgRef.current;
    if (!img || !vpSize) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImageSize({ w, h });
    const minScale = Math.max(vpSize / w, vpSize / h);
    const tx = (vpSize - w * minScale) / 2;
    const ty = (vpSize - h * minScale) / 2;
    setTransform({ tx, ty, scale: minScale });
  }

  const bounds = computeBounds(imageSize, vpSize);

  // Drag y pinch unificados con PointerEvents.

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: transform.scale,
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      // Drag puro: trasladar tx/ty por el delta.
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setTransform((t) =>
        clamp(
          { tx: t.tx + dx, ty: t.ty + dy, scale: t.scale },
          imageSize,
          vpSize,
          bounds,
        ),
      );
    } else if (pointersRef.current.size === 2 && pinchStartRef.current) {
      // Pinch zoom: nuevo scale proporcional al cambio de distancia.
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const newScale =
        pinchStartRef.current.scale *
        (dist / pinchStartRef.current.distance);
      setTransform((t) => zoomAroundCenter(t, newScale, vpSize, imageSize, bounds));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    // Wheel zoom desktop. deltaY negativo = scroll up = zoom in.
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((t) =>
      zoomAroundCenter(t, t.scale * factor, vpSize, imageSize, bounds),
    );
  }

  function handleZoomButton(direction: "in" | "out") {
    haptic("tap");
    const factor = direction === "in" ? 1.18 : 0.85;
    setTransform((t) =>
      zoomAroundCenter(t, t.scale * factor, vpSize, imageSize, bounds),
    );
  }

  function handleConfirm() {
    if (!imgRef.current || !vpSize || !imageSize.w) return;
    try {
      const dataUrl = cropToDataURL(imgRef.current, transform, vpSize);
      haptic("success");
      onConfirm(dataUrl);
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        setError(err.message);
      } else {
        setError("No pudimos guardar el recorte. Probá de nuevo.");
      }
    }
  }

  return (
    <div className={styles.root}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageDataUrl}
          alt="Foto subida — encuadrá la cara dentro del óvalo"
          className={styles.image}
          style={{
            transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        <FaceGuide />
        <div className={styles.zoomBar}>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => handleZoomButton("out")}
            aria-label="Alejar"
            disabled={transform.scale <= bounds.minScale + 0.001}
          >
            −
          </button>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => handleZoomButton("in")}
            aria-label="Acercar"
            disabled={transform.scale >= bounds.maxScale - 0.001}
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <p className={styles.hint}>
        Arrastrá la foto y pellizcá para hacer zoom. Tu cara tiene que
        entrar en el óvalo.
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionPrimary}`}
          onClick={handleConfirm}
        >
          Usar esta foto
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ── Helpers de matemática ─────────────────────────────────────────── */

function computeBounds(
  imageSize: { w: number; h: number },
  vpSize: number,
): Bounds {
  if (!imageSize.w || !imageSize.h || !vpSize) {
    return { minScale: 1, maxScale: MAX_SCALE_MULTIPLIER };
  }
  const minScale = Math.max(vpSize / imageSize.w, vpSize / imageSize.h);
  return { minScale, maxScale: minScale * MAX_SCALE_MULTIPLIER };
}

function clamp(
  t: Transform,
  imageSize: { w: number; h: number },
  vpSize: number,
  bounds: Bounds,
): Transform {
  if (!imageSize.w || !vpSize) return t;
  const scale = Math.max(bounds.minScale, Math.min(bounds.maxScale, t.scale));
  const renderedW = imageSize.w * scale;
  const renderedH = imageSize.h * scale;
  const minTx = vpSize - renderedW;
  const minTy = vpSize - renderedH;
  const tx = Math.max(minTx, Math.min(0, t.tx));
  const ty = Math.max(minTy, Math.min(0, t.ty));
  return { tx, ty, scale };
}

function zoomAroundCenter(
  t: Transform,
  newScale: number,
  vpSize: number,
  imageSize: { w: number; h: number },
  bounds: Bounds,
): Transform {
  // Punto del image bajo el centro del viewport, antes del zoom.
  const cx = vpSize / 2;
  const cy = vpSize / 2;
  const imgX = (cx - t.tx) / t.scale;
  const imgY = (cy - t.ty) / t.scale;
  // Aplicamos el nuevo scale y recolocamos tx/ty para que ese mismo
  // punto siga bajo el centro.
  const clampedScale = Math.max(
    bounds.minScale,
    Math.min(bounds.maxScale, newScale),
  );
  const tx = cx - imgX * clampedScale;
  const ty = cy - imgY * clampedScale;
  return clamp({ tx, ty, scale: clampedScale }, imageSize, vpSize, bounds);
}

function cropToDataURL(
  img: HTMLImageElement,
  t: Transform,
  vpSize: number,
): string {
  // Calculamos qué porción del source image corresponde al viewport.
  const sx = -t.tx / t.scale;
  const sy = -t.ty / t.scale;
  const sw = vpSize / t.scale;
  const sh = vpSize / t.scale;

  const outSize = Math.min(OUTPUT_MAX_SIZE, Math.round(sw));
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageProcessingError("No se pudo crear el canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outSize, outSize);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/* ── Face guide overlay (mismo óvalo que el de la cámara en vivo) ──── */

function FaceGuide() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className={styles.faceGuide}
      aria-hidden
    >
      <defs>
        <mask id="photo-editor-mask">
          <rect width="100" height="100" fill="white" />
          <ellipse cx="50" cy="48" rx="22" ry="30" fill="black" />
        </mask>
      </defs>
      <rect
        width="100"
        height="100"
        fill="rgba(0, 0, 0, 0.45)"
        mask="url(#photo-editor-mask)"
      />
      <ellipse
        cx="50"
        cy="48"
        rx="22"
        ry="30"
        fill="none"
        stroke="rgba(231, 206, 142, 0.92)"
        strokeWidth="0.55"
        strokeDasharray="2 1.4"
      />
      <g stroke="rgba(231, 206, 142, 0.85)" strokeWidth="0.5" fill="none">
        <path d="M 18 14 L 18 10 L 22 10" />
        <path d="M 82 14 L 82 10 L 78 10" />
        <path d="M 18 86 L 18 90 L 22 90" />
        <path d="M 82 86 L 82 90 L 78 90" />
      </g>
    </svg>
  );
}
