"use client";

/*
 * AppFlow — orquestador del flujo principal.
 *
 * Una sola pantalla a la vez (estilo app nativa, sin scroll).
 * Las transiciones usan View Transitions API con dirección semántica:
 *   - forward = avanzo (slide left ↔ right)
 *   - backward = vuelvo (slide opuesto)
 * Fallback automático a la animación CSS .step cuando el browser no
 * soporta startViewTransition (Safari < 18, Firefox).
 *
 * Estados:
 *   step="camera"   → Camera. Cuando la foto está lista, avanza a choose.
 *   step="choose"   → header compacto (photoChip + GenderToggle) + título
 *                     + CharacterPicker + BottomActionBar fija con CTA.
 *                     Diseñado para caber en 100dvh sin scroll.
 *   step="painting" → LoadingState (Sol bordándose) con botón Cancelar.
 *   step="result"   → PortraitFrame con RayBurst de celebración detrás +
 *                     "Probar con otra foto".
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
import { BottomActionBar } from "@/components/BottomActionBar";
import { RayBurst } from "@/components/RayBurst";
import {
  CHARACTERS,
  getCharacterById,
  getFullName,
  getShortLabel,
} from "@/lib/characters";
import { dataUrlToFile } from "@/lib/image";
import { haptic } from "@/lib/haptic";
import { transitionState } from "@/lib/transition";
import type {
  TransformRequest,
  TransformResponse,
} from "@/app/api/transform/types";

type Step = "camera" | "choose" | "painting" | "result";

const PAINT_TIMEOUT_MS = 90_000;

function isBillingError(message: string | null): boolean {
  if (!message) return false;
  return /billing|cuota gratuita|tier pago/i.test(message);
}

function describeFetchError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "La generación se canceló.";
  }
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
  // burstKey cambia cada vez que llega un retrato — dispara la animación
  // de rayos dorados detrás del PortraitFrame.
  const [burstKey, setBurstKey] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);

  const selected = characterId ? getCharacterById(characterId) : null;
  const fullName = selected ? getFullName(selected, gender) : "Sin elegir";

  function goCamera() {
    transitionState(() => {
      setStep("camera");
      setPhoto(null);
      setCharacterId(null);
      setPortrait(null);
      setTransformError(null);
      setIsDemoMode(false);
      setBurstKey(null);
    }, "backward");
  }

  function handleEnterDemoMode() {
    if (!photo || !characterId) return;
    transitionState(() => {
      setTransformError(null);
      setIsDemoMode(true);
      setPortrait("/sample-portrait.svg");
      setBurstKey(Date.now());
      setStep("result");
    }, "forward");
  }

  function handlePhotoReady(dataUrl: string) {
    transitionState(() => {
      setPhoto(dataUrl);
      setStep("choose");
    }, "forward");
  }

  async function handleStartPaint() {
    if (!photo || !characterId) return;
    haptic("select");
    setTransformError(null);
    setIsDemoMode(false);
    transitionState(() => setStep("painting"), "forward");

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

      transitionState(() => {
        setPortrait(data.image);
        setBurstKey(Date.now());
        setStep("result");
      }, "forward");
      haptic("success");
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError" &&
        userCancelledRef.current
      ) {
        transitionState(() => setStep("choose"), "backward");
        return;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        setTransformError(
          "El retrato tardó más de lo esperado. Probá con otra foto o esperá un momento y reintentá.",
        );
        transitionState(() => setStep("choose"), "backward");
        return;
      }
      setTransformError(describeFetchError(err));
      transitionState(() => setStep("choose"), "backward");
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
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        await handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        alert("No pudimos abrir el panel de compartir. Probá descargar.");
      }
    }
  }

  // En el step camera no mostramos botón "volver" (es el inicio); en el resto
  // sí. Es la única affordance "back" que necesita el flujo — no es una app
  // multinivel, sólo cuatro pasos lineales.
  const showBack = step !== "camera";

  return (
    <div className={styles.shell}>
      {showBack && (
        <button
          type="button"
          className={styles.backFab}
          onClick={goCamera}
          aria-label="Volver al inicio"
        >
          <BackChevron />
        </button>
      )}

      <main className={styles.main} data-step={step}>
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
                isBillingError(transformError) ? handleEnterDemoMode : null
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
              burstKey={burstKey}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function BackChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/* ── Pantalla CHOOSE — compacta, sin scroll, CTA en BottomActionBar ── */

interface ChooseScreenProps {
  photo: string;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  characterId: CharacterId | null;
  onCharacterChange: (id: CharacterId) => void;
  onRetakePhoto: () => void;
  onStart: () => void;
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
      <header className={styles.chooseHeader}>
        <button
          type="button"
          className={styles.photoChip}
          onClick={onRetakePhoto}
          aria-label="Cambiar foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" />
          <span className={styles.photoChipBadge} aria-hidden>
            <RetakeGlyph />
          </span>
        </button>
        <GenderToggle value={gender} onChange={onGenderChange} />
      </header>

      {errorMessage && (
        <div role="alert" className={styles.flashError}>
          <p className={styles.flashErrorText}>{errorMessage}</p>
          {onEnterDemo && (
            <button
              type="button"
              className={styles.flashErrorAction}
              onClick={onEnterDemo}
            >
              Probar en modo demo
            </button>
          )}
        </div>
      )}

      <h2 className={styles.chooseTitle}>
        <span className={styles.chooseTitleDropcap}>E</span>legí tu{" "}
        <em>personaje</em>
      </h2>

      <div className={styles.chooseGrid}>
        <CharacterPicker
          characters={CHARACTERS}
          selectedId={characterId}
          onSelect={onCharacterChange}
          labelFor={(c) => getShortLabel(c, gender)}
        />
      </div>

      <BottomActionBar>
        <button
          type="button"
          className={styles.cta}
          onClick={onStart}
          disabled={!characterId}
        >
          {characterId ? `Pintarme como ${fullName}` : "Elegí un rol primero"}
        </button>
      </BottomActionBar>
    </div>
  );
}

/* ── Pantalla RESULT — PortraitFrame + RayBurst + restart ──────────── */

interface ResultScreenProps {
  portrait: string;
  characterName: string;
  onDownload: () => void;
  onShare: () => void;
  onRestart: () => void;
  isDemoMode: boolean;
  burstKey: number | null;
}

function ResultScreen({
  portrait,
  characterName,
  onDownload,
  onShare,
  onRestart,
  isDemoMode,
  burstKey,
}: ResultScreenProps) {
  return (
    <div className={styles.result}>
      {isDemoMode && (
        <p className={styles.demoBadge} role="note">
          Modo demo — este retrato es un placeholder, no fue generado por
          la IA.
        </p>
      )}
      <div className={styles.resultStage}>
        <RayBurst trigger={burstKey} />
        <PortraitFrame
          imageDataUrl={portrait}
          characterName={characterName}
          variant="cabildo"
          onDownload={onDownload}
          onShare={onShare}
        />
      </div>
      <button type="button" className={styles.restart} onClick={onRestart}>
        Probar con otra foto
      </button>
    </div>
  );
}

/* ── Iconos in-place ─────────────────────────────────────────────────── */

function RetakeGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 8a6 6 0 0 1 10.5-4M14 2v3.5h-3.5" />
      <path d="M14 8a6 6 0 0 1-10.5 4M2 14v-3.5h3.5" />
    </svg>
  );
}
