"use client";

/*
 * Camera — captura de foto desde la cámara o subida de archivo.
 *
 * UX:
 *  - Estado inicial: dos botones grandes. "Sacar foto" abre directamente
 *    la cámara trasera en mobile (capture="environment"). "Subir foto"
 *    abre el picker de archivos normal.
 *  - Después de seleccionar: se muestra una previsualización + "Usar esta
 *    foto" (avanza al picker de personaje) y "Sacar otra" (reset).
 *
 * El componente NO decide cuándo avanzar al próximo paso — sólo llama
 * `onPhotoReady` con el dataURL JPEG ya redimensionado.
 */

import { useRef, useState } from "react";
import { ImageProcessingError, resizeImage } from "@/lib/image";
import styles from "./Camera.module.css";

export interface CameraProps {
  onPhotoReady: (dataUrl: string) => void;
}

export function Camera({ onPhotoReady }: CameraProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset el input para que volver a seleccionar el mismo archivo dispare onChange.
    e.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        setError(err.message);
      } else {
        setError("Algo salió mal al procesar la foto. Probá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleRetake() {
    setPreview(null);
    setError(null);
  }

  function handleUse() {
    if (preview) onPhotoReady(preview);
  }

  return (
    <div className={styles.root}>
      {!preview && (
        <div className={styles.intro}>
          <h2 className={styles.heading}>Sacate una foto</h2>
          <p className={styles.subheading}>
            Procurá buena luz y mirá de frente. Una sola persona en la foto
            da mejores resultados.
          </p>
        </div>
      )}

      {preview ? (
        <figure className={styles.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Foto recién tomada"
            className={styles.previewImage}
          />
        </figure>
      ) : (
        <div className={styles.placeholder} aria-hidden>
          <CameraGlyph />
        </div>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {!preview ? (
          <>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionPrimary}`}
              onClick={() => cameraInputRef.current?.click()}
              disabled={busy}
            >
              <CameraIcon />
              <span>{busy ? "Procesando…" : "Sacar foto"}</span>
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <UploadIcon />
              <span>Subir foto</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionPrimary}`}
              onClick={handleUse}
            >
              <CheckIcon />
              <span>Usar esta foto</span>
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleRetake}
            >
              <RetakeIcon />
              <span>Sacar otra</span>
            </button>
          </>
        )}
      </div>

      {/* Inputs ocultos. capture="environment" abre la cámara trasera en mobile. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className={styles.hidden}
        aria-hidden
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hidden}
        aria-hidden
      />
    </div>
  );
}

/* ── Iconos inline ────────────────────────────────────────────────────── */

function CameraGlyph() {
  return (
    <svg
      viewBox="0 0 120 90"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.placeholderSvg}
      aria-hidden
    >
      <rect x="6" y="18" width="108" height="66" rx="8" fill="currentColor" opacity="0.18" />
      <rect x="6" y="18" width="108" height="66" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 42 18 L 50 8 L 70 8 L 78 18 Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="51" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="51" r="9" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h2l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-3h2" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M12 4v12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function RetakeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
