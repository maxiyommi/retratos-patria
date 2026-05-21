"use client";

/*
 * Camera — captura con cámara en vivo + guía de óvalo facial.
 *
 * Usa getUserMedia para mostrar la cámara FRONTAL (selfie) por defecto en
 * un viewport cuadrado 1:1 con un óvalo dorado superpuesto que indica
 * dónde encuadrar la cara. Esto le da feel de app nativa de selfie:
 *   - video en vivo (no la cámara del sistema)
 *   - mirror flip horizontal para que se vea como un espejo
 *   - botón de captura redondo grande estilo iOS
 *   - botones laterales para alternar cámara (frontal/trasera) y subir
 *     una foto desde la galería
 *
 * Fallback automático cuando getUserMedia no está disponible:
 *   - permiso denegado por el usuario (NotAllowedError)
 *   - contexto inseguro (http en LAN, sin HTTPS)
 *   - browser sin soporte
 *   → cae a un botón único "Subir foto" que usa el file picker normal.
 *
 * Snapshot: cropea al cuadrado 1:1 que el usuario realmente vio (centrado
 * con object-fit cover), después pasa por resizeImage para garantizar
 * lado máximo 1024px y JPEG 0.85.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageProcessingError, resizeImage } from "@/lib/image";
import { haptic } from "@/lib/haptic";
import { PhotoEditor } from "@/components/PhotoEditor";
import styles from "./Camera.module.css";

export interface CameraProps {
  onPhotoReady: (dataUrl: string) => void;
}

type Facing = "user" | "environment";
type CameraStatus = "booting" | "active" | "denied" | "unsupported";

export function Camera({ onPhotoReady }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facing, setFacing] = useState<Facing>("user");
  const [status, setStatus] = useState<CameraStatus>("booting");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /*
   * editingImageUrl: cuando el usuario sube una foto (no snapshot de la
   * cámara en vivo), la cargamos cruda y abrimos PhotoEditor para que la
   * encuadre dentro del óvalo. Al confirmar, el dataURL recortado pasa
   * a preview. Si cancela, vuelve al estado anterior (cámara o fallback).
   */
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (face: Facing) => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setStatus("unsupported");
        return;
      }
      setStatus("booting");
      setError(null);
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: face },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("active");
      } catch (err) {
        const name = (err as Error).name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setStatus("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          // No hay cámara con ese facingMode — probar la otra antes de rendirse.
          if (face === "user") {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
              });
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
              setFacing("environment");
              setStatus("active");
              return;
            } catch {
              setStatus("unsupported");
            }
          } else {
            setStatus("unsupported");
          }
        } else {
          setStatus("unsupported");
        }
      }
    },
    [stopStream],
  );

  // Encender la cámara al montar y cuando cambia el facing. Apagarla
  // mientras se previsualiza una foto (privacidad + batería).
  useEffect(() => {
    if (preview) {
      stopStream();
      return;
    }
    // startStream actualiza estado (status/error) — eslint marca esto pero
    // es el patrón correcto para "iniciar un side-effect async al montar /
    // cambiar facing". useSyncExternalStore no aplica acá porque la lógica
    // de transición de estados es propia del componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startStream(facing);
    return () => stopStream();
  }, [facing, preview, startStream, stopStream]);

  async function handleSnapshot() {
    const video = videoRef.current;
    if (!video || status !== "active") return;
    haptic("shutter");
    setBusy(true);
    setError(null);
    try {
      // Cropeo al cuadrado 1:1 que el usuario realmente encuadró.
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        throw new ImageProcessingError("La cámara aún no envió ningún cuadro.");
      }
      const side = Math.min(vw, vh);
      const sx = (vw - side) / 2;
      const sy = (vh - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new ImageProcessingError("No se pudo crear el canvas.");
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Espejo horizontal cuando se está usando la cámara frontal — así la
      // foto capturada matchea exactamente con lo que el usuario vio en
      // vivo (que también está espejado por CSS para el feel de selfie).
      // Si no espejáramos, el preview "saltaría" de orientación y resulta
      // confuso. Para Gemini no afecta: las caras son ~simétricas y la
      // ropa real se reemplaza por la de 1810.
      if (facing === "user") {
        ctx.translate(side, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(new ImageProcessingError("Snapshot vacío.")),
          "image/jpeg",
          0.95,
        );
      });
      const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        setError(err.message);
      } else {
        setError("No pudimos capturar la foto. Probá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo no parece ser una imagen.");
      return;
    }
    setBusy(true);
    try {
      const rawDataUrl = await readFileAsDataURL(file);
      // En vez de pasar directo a preview, abrimos el editor para que
      // el usuario encuadre el rostro dentro del óvalo.
      setEditingImageUrl(rawDataUrl);
    } catch {
      setError("No pudimos leer la imagen. Probá con otra.");
    } finally {
      setBusy(false);
    }
  }

  function handleEditorConfirm(croppedDataUrl: string) {
    setEditingImageUrl(null);
    setPreview(croppedDataUrl);
  }

  function handleEditorCancel() {
    setEditingImageUrl(null);
  }

  function handleRetake() {
    setPreview(null);
    setError(null);
  }

  function handleUse() {
    if (preview) {
      haptic("select");
      onPhotoReady(preview);
    }
  }

  function toggleFacing() {
    haptic("tap");
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }

  const showLiveCamera = !preview && !editingImageUrl && status === "active";
  const showFallback = !preview && !editingImageUrl && status !== "active";
  const liveMirrored = facing === "user";

  // Cuando el usuario está editando una foto subida, mostramos sólo el
  // PhotoEditor en lugar del viewport + acciones de cámara.
  if (editingImageUrl) {
    return (
      <div className={styles.root}>
        <PhotoEditor
          imageDataUrl={editingImageUrl}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/*
        El LargeTitle del AppFlow ya cumple la función de "intro": eyebrow
        "Paso 1 · El espejo" + título "Mirate" + subtítulo guía. Aquí
        renderizamos directamente el viewport sin texto redundante.
      */}

      <div className={styles.viewport}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Foto recién tomada"
            className={styles.viewportMedia}
          />
        ) : showLiveCamera ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`${styles.viewportMedia} ${
                liveMirrored ? styles.videoMirrored : ""
              }`}
            />
            <FaceGuide />
          </>
        ) : (
          <div className={styles.fallback}>
            <CameraGlyph />
            {status === "booting" ? (
              <p className={styles.fallbackText}>Preparando la cámara…</p>
            ) : status === "denied" ? (
              <>
                <p className={styles.fallbackText}>
                  La app no tiene permiso para usar la cámara.
                </p>
                <p className={styles.fallbackHint}>
                  Podés subir una foto desde la galería con el botón de
                  abajo.
                </p>
              </>
            ) : (
              <>
                <p className={styles.fallbackText}>
                  No se puede acceder a la cámara desde acá.
                </p>
                <p className={styles.fallbackHint}>
                  Probá subiendo una foto desde la galería.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {preview ? (
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
        ) : showLiveCamera ? (
          <div className={styles.captureRow}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleFacing}
              aria-label={
                facing === "user"
                  ? "Cambiar a cámara trasera"
                  : "Cambiar a cámara frontal"
              }
            >
              <FlipIcon />
            </button>
            <button
              type="button"
              className={styles.shutter}
              onClick={handleSnapshot}
              disabled={busy}
              aria-label="Sacar foto"
            >
              <span className={styles.shutterRing} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Subir foto desde la galería"
            >
              <UploadIcon />
            </button>
          </div>
        ) : (
          // Fallback: sólo "Subir foto"
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionPrimary}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <UploadIcon />
            <span>{busy ? "Procesando…" : "Subir foto"}</span>
          </button>
        )}
      </div>

      {showFallback && status === "denied" && (
        <p className={styles.hintBelow}>
          Tip: en el celular se vuelve a pedir el permiso recargando la
          página.
        </p>
      )}

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

/* ── Guía facial sobre el viewport en vivo ──────────────────────────── */

function FaceGuide() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className={styles.faceGuide}
      aria-hidden
    >
      {/* Vignette: opacidad sólo afuera del óvalo. */}
      <defs>
        <mask id="face-guide-mask">
          <rect width="100" height="100" fill="white" />
          <ellipse cx="50" cy="48" rx="22" ry="30" fill="black" />
        </mask>
      </defs>
      <rect
        width="100"
        height="100"
        fill="rgba(0, 0, 0, 0.45)"
        mask="url(#face-guide-mask)"
      />
      {/* Óvalo dorado con stroke discontinuo — el "encuadre" sugerido. */}
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
      {/* Pequeños "marcadores de esquina" para dar geometría tipo visor. */}
      <g stroke="rgba(231, 206, 142, 0.85)" strokeWidth="0.5" fill="none">
        <path d="M 18 14 L 18 10 L 22 10" />
        <path d="M 82 14 L 82 10 L 78 10" />
        <path d="M 18 86 L 18 90 L 22 90" />
        <path d="M 82 86 L 82 90 L 78 90" />
      </g>
    </svg>
  );
}

/* ── Iconos ─────────────────────────────────────────────────────────── */

function CameraGlyph() {
  return (
    <svg
      viewBox="0 0 120 90"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.fallbackSvg}
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

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8a8 8 0 0 0-14-3" />
      <path d="M21 3v5h-5" />
      <path d="M3 16a8 8 0 0 0 14 3" />
      <path d="M3 21v-5h5" />
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

/** Lee un File a dataURL crudo (sin resize). El editor necesita la
 *  resolución original para que el usuario pueda hacer zoom y ver
 *  detalle. El recorte final pasa por resize en cropToDataURL. */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
