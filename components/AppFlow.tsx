"use client";

/*
 * AppFlow — orquestador del flujo principal.
 *
 * Una pantalla a la vez (estilo app nativa). Transiciones simples entre
 * pantallas: cada step se monta con key={step} para disparar la animación
 * de entrada definida en page.module.css (.step).
 *
 * Estados:
 *   step="camera" → Camera. Cuando la foto está lista, pasa a "choose".
 *   step="choose" → preview + GenderToggle + CharacterPicker + botón
 *                   "Pintar mi retrato". Habilitado sólo cuando hay
 *                   personaje seleccionado.
 *   step="painting" → LoadingState mientras se procesa. Mock por ahora
 *                     (timeout 8s con la imagen sample). Bloque 7 conecta
 *                     a /api/transform.
 *   step="result" → PortraitFrame con el retrato + acciones de descargar,
 *                   compartir y "probar otro".
 */

import { useRef, useState } from "react";
import styles from "./AppFlow.module.css";
import { Camera } from "@/components/Camera";
import {
  CharacterPicker,
  type CharacterId,
} from "@/components/CharacterPicker";
import { GenderToggle, type Gender } from "@/components/GenderToggle";
import { LoadingState } from "@/components/LoadingState";
import { PortraitFrame } from "@/components/PortraitFrame";
import { Footer } from "@/components/Footer";
import {
  CHARACTERS,
  getCharacterById,
  getFullName,
  getShortLabel,
} from "@/lib/characters";
import { dataUrlToFile } from "@/lib/image";
import { haptic } from "@/lib/haptic";
import type {
  TransformRequest,
  TransformResponse,
} from "@/app/api/transform/types";

type Step = "camera" | "choose" | "painting" | "result";

// Tiempo máximo de espera antes de abortar la request. Gemini suele tardar
// 8-15s; le damos margen amplio pero finito para que el spinner no quede
// infinito si el modelo se cuelga o la red se cae mid-request.
const PAINT_TIMEOUT_MS = 90_000;

// Heurística: si el mensaje del backend menciona billing/cuota gratuita,
// ofrecemos un fallback de modo demo (placeholder sepia) para que el
// usuario pueda recorrer toda la UI sin necesidad de habilitar el pago.
function isBillingError(message: string | null): boolean {
  if (!message) return false;
  return /billing|cuota gratuita|tier pago/i.test(message);
}

/** Convierte un error crudo del fetch en un mensaje legible en es-AR. */
function describeFetchError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    // Distinguimos abort por timeout vs abort por usuario en el contexto
    // donde llamamos. Acá devolvemos el mensaje "neutro" — el llamador
    // decide si lo muestra o lo descarta.
    return "La generación se canceló.";
  }
  // "Failed to fetch" es el mensaje que tira el browser cuando no hay red,
  // CORS bloqueado, o el server local cayó.
  if (
    err instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(err.message)
  ) {
    return "No pudimos contactar al servidor. Revisá tu conexión a internet y probá de nuevo.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "No pudimos generar el retrato. Probá de nuevo.";
}

export function AppFlow() {
  const [step, setStep] = useState<Step>("camera");
  const [photo, setPhoto] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<CharacterId | null>(null);
  const [gender, setGender] = useState<Gender>("dama");
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);
  // Ref del controller activo para que el botón Cancelar pueda abortarlo.
  // Lo distinguimos de un abort por timeout con userCancelledRef.
  const abortRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);

  const selected = characterId ? getCharacterById(characterId) : null;
  const fullName = selected ? getFullName(selected, gender) : "Sin elegir";

  function goCamera() {
    setStep("camera");
    setPhoto(null);
    setCharacterId(null);
    setPortrait(null);
    setTransformError(null);
    setIsDemoMode(false);
  }

  function handleEnterDemoMode() {
    if (!photo || !characterId) return;
    setTransformError(null);
    setIsDemoMode(true);
    setPortrait("/sample-portrait.svg");
    setStep("result");
  }

  function handlePhotoReady(dataUrl: string) {
    setPhoto(dataUrl);
    setStep("choose");
  }

  async function handleStartPaint() {
    if (!photo || !characterId) return;
    haptic("select");
    setTransformError(null);
    setIsDemoMode(false);
    setStep("painting");

    // AbortController fresco por request. Timeout duro a PAINT_TIMEOUT_MS;
    // adicionalmente, el botón Cancelar de LoadingState aborta este mismo
    // controller (vía handleCancelPaint).
    const controller = new AbortController();
    abortRef.current = controller;
    userCancelledRef.current = false;
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      PAINT_TIMEOUT_MS,
    );

    const requestBody: TransformRequest = {
      image: photo,
      characterId,
      gender,
    };

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      const data = (await res.json()) as TransformResponse;

      if (!res.ok || "error" in data) {
        const message =
          "error" in data
            ? data.error
            : "Algo salió mal al generar el retrato.";
        throw new Error(message);
      }

      setPortrait(data.image);
      setStep("result");
      haptic("success");
    } catch (err) {
      // Cancelación intencional del usuario: no mostramos error, sólo
      // volvemos al paso de choose.
      if (
        err instanceof DOMException &&
        err.name === "AbortError" &&
        userCancelledRef.current
      ) {
        setStep("choose");
        return;
      }
      // Abort por timeout: mensaje específico distinto al de cancelación.
      if (err instanceof DOMException && err.name === "AbortError") {
        setTransformError(
          "El retrato tardó más de lo esperado. Probá con otra foto o esperá un momento y reintentá.",
        );
        setStep("choose");
        return;
      }
      setTransformError(describeFetchError(err));
      setStep("choose");
      haptic("error");
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function handleCancelPaint() {
    if (!abortRef.current) return;
    haptic("tap");
    userCancelledRef.current = true;
    abortRef.current.abort();
  }

  async function handleDownload() {
    if (!portrait) return;
    try {
      const file = dataUrlToFile(portrait, `retrato-${characterId}.jpg`);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("No pudimos preparar la descarga. Probá de nuevo.");
    }
  }

  async function handleShare() {
    if (!portrait) return;
    try {
      const file = dataUrlToFile(portrait, `retrato-${characterId}.jpg`);
      const shareData: ShareData = {
        title: "Mi Retrato de la Patria",
        text: `Me retraté como ${fullName} de 1810.`,
        files: [file],
      };
      // navigator.canShare valida que el navegador soporte compartir archivos.
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: descargar directamente.
        await handleDownload();
      }
    } catch (err) {
      // AbortError ocurre si el usuario cancela el panel de compartir — ignorar.
      if ((err as Error).name !== "AbortError") {
        alert("No pudimos abrir el panel de compartir. Probá descargar.");
      }
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.brand}>
        <button
          type="button"
          className={styles.brandButton}
          onClick={goCamera}
          aria-label="Volver al inicio"
        >
          <span className={styles.brandTitle}>Retratos de la Patria</span>
        </button>
      </header>

      <main className={styles.main}>
        <div key={step} className={styles.step}>
          {step === "camera" && (
            <Camera onPhotoReady={handlePhotoReady} />
          )}

          {step === "choose" && photo && (
            <ChooseScreen
              photo={photo}
              gender={gender}
              onGenderChange={setGender}
              characterId={characterId}
              onCharacterChange={setCharacterId}
              onRetakePhoto={goCamera}
              onStart={handleStartPaint}
              onEnterDemo={
                isBillingError(transformError)
                  ? handleEnterDemoMode
                  : null
              }
              fullName={fullName}
              errorMessage={transformError}
            />
          )}

          {step === "painting" && (
            <LoadingState
              characterName={fullName}
              onCancel={handleCancelPaint}
            />
          )}

          {step === "result" && portrait && (
            <ResultScreen
              portrait={portrait}
              characterName={fullName}
              onDownload={handleDownload}
              onShare={handleShare}
              onRestart={goCamera}
              isDemoMode={isDemoMode}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ── Pantallas internas ─────────────────────────────────────────────── */

interface ChooseScreenProps {
  photo: string;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  characterId: CharacterId | null;
  onCharacterChange: (id: CharacterId) => void;
  onRetakePhoto: () => void;
  onStart: () => void;
  /** Si está definido, mostramos un botón "Probar en modo demo" en el flash de error. */
  onEnterDemo: (() => void) | null;
  fullName: string;
  errorMessage: string | null;
}

function ChooseScreen({
  photo,
  gender,
  onGenderChange,
  characterId,
  onCharacterChange,
  onRetakePhoto,
  onStart,
  onEnterDemo,
  fullName,
  errorMessage,
}: ChooseScreenProps) {
  return (
    <div className={styles.choose}>
      {errorMessage && (
        <div role="alert" className={styles.flashError}>
          <p className={styles.flashErrorText}>{errorMessage}</p>
          {onEnterDemo && (
            <button
              type="button"
              className={styles.flashErrorAction}
              onClick={onEnterDemo}
            >
              Probar en modo demo (sin generar)
            </button>
          )}
        </div>
      )}

      <section className={styles.photoStrip}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Tu foto" className={styles.photoStripImage} />
        <button
          type="button"
          className={styles.photoStripChange}
          onClick={onRetakePhoto}
        >
          Cambiar foto
        </button>
      </section>

      <section className={styles.chooseBlock}>
        <h2 className={styles.chooseTitle}>
          Quiero ser <em>representad@</em> como
        </h2>
        <GenderToggle value={gender} onChange={onGenderChange} />
      </section>

      <section className={styles.chooseBlock}>
        <h2 className={styles.chooseTitle}>
          Elegí un <em>rol</em>
        </h2>
        <CharacterPicker
          characters={CHARACTERS}
          selectedId={characterId}
          onSelect={onCharacterChange}
          labelFor={(c) => getShortLabel(c, gender)}
        />
      </section>

      <button
        type="button"
        className={styles.cta}
        onClick={onStart}
        disabled={!characterId}
      >
        {characterId
          ? `Pintarme como ${fullName}`
          : "Elegí un personaje primero"}
      </button>
    </div>
  );
}

interface ResultScreenProps {
  portrait: string;
  characterName: string;
  onDownload: () => void;
  onShare: () => void;
  onRestart: () => void;
  isDemoMode: boolean;
}

function ResultScreen({
  portrait,
  characterName,
  onDownload,
  onShare,
  onRestart,
  isDemoMode,
}: ResultScreenProps) {
  return (
    <div className={styles.result}>
      {isDemoMode && (
        <p className={styles.demoBadge} role="note">
          Modo demo — este retrato es un placeholder, no fue generado por
          la IA.
        </p>
      )}
      <PortraitFrame
        imageDataUrl={portrait}
        characterName={characterName}
        variant="cabildo"
        onDownload={onDownload}
        onShare={onShare}
      />
      <button
        type="button"
        className={styles.restart}
        onClick={onRestart}
      >
        Probar con otra foto
      </button>
    </div>
  );
}
