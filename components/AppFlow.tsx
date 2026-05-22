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

import { useEffect, useRef, useState } from "react";
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
import { LargeTitle } from "@/components/LargeTitle";
import { SolFlash } from "@/components/SolFlash";
import { Footer } from "@/components/Footer";
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

/*
 * theme-color por step — matchea con --bg-bottom de cada habitación
 * en globals.css. Cuando el step cambia, actualizamos el meta tag y
 * la URL bar / tab strip del browser se tiñe del color del fondo, así
 * la app y el chrome del browser parecen un único continuo.
 */
const THEME_COLOR_BY_STEP: Record<Step, string> = {
  camera: "#143b5a",
  choose: "#2f6f9b",
  painting: "#2a1a0e",
  result: "#110a05",
};

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

/**
 * Estampa el retrato con la inscripción "Imagen generada con IA" en la
 * esquina inf. derecha (banda gradient oscura + texto italic blanco).
 * Devuelve un nuevo dataURL JPEG. Se llama en useEffect apenas llega el
 * retrato, así el resultado queda cacheado y los handlers download/share
 * son síncronos respecto al click.
 */
function stampWithAiNotice(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);

        const fontSize = Math.round(h * 0.024);
        const padY = Math.round(h * 0.015);
        const padX = Math.round(w * 0.025);

        // Banda gradient del 88% al 100% del alto.
        const gradient = ctx.createLinearGradient(0, h * 0.88, 0, h);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.45)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, h * 0.88, w, h * 0.12);

        ctx.fillStyle = "rgba(251, 247, 236, 0.95)";
        ctx.font = `italic ${fontSize}px "EB Garamond", Georgia, serif`;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "right";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 4;
        ctx.fillText("Imagen generada con IA", w - padX, h - padY);
        ctx.shadowBlur = 0;

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("img load failed"));
    img.src = dataUrl;
  });
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
  const shortName = selected ? getShortLabel(selected, gender) : "";

  // Sincronizamos el step actual con html[data-step] para que globals.css
  // pueda cambiar el background atmosférico por habitación. Además
  // actualizamos el meta theme-color dinámicamente — eso hace que la
  // URL bar / tab strip de Safari iOS y la status bar de Chrome Android
  // matcheen el color de fondo de cada step, dando la sensación de
  // que la app y el chrome del browser son un solo continuo.
  useEffect(() => {
    document.documentElement.dataset.step = step;
    const meta = document.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;
    if (meta) {
      meta.setAttribute("content", THEME_COLOR_BY_STEP[step]);
    }
  }, [step]);

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

  /*
   * stampedPortrait: versión del retrato con la inscripción 'Imagen
   * generada con IA' renderizada encima. Se pre-computa apenas llega el
   * retrato (effect siguiente) y se cachea, así cuando el usuario toca
   * Compartir el click handler es prácticamente síncrono y el browser
   * conserva el 'user activation' para abrir el panel nativo.
   *
   * Sin esta cache, el await del canvas drawing borraba la activation
   * y navigator.share era rechazado en Safari/Chrome mobile.
   */
  const [stampedPortrait, setStampedPortrait] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!portrait) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStampedPortrait(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stamped = await stampWithAiNotice(portrait);
        if (!cancelled) setStampedPortrait(stamped);
      } catch {
        if (!cancelled) setStampedPortrait(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portrait]);

  function handleDownload() {
    if (!portrait) return;
    try {
      const dataUrl = stampedPortrait ?? portrait;
      const file = dataUrlToFile(dataUrl, `retrato-${characterId}.jpg`);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      haptic("tap");
    } catch {
      alert("No pudimos preparar la descarga. Probá de nuevo.");
    }
  }

  async function handleShare() {
    if (!portrait) return;

    // Diagnóstico — Web Share API requiere secure context (HTTPS o
    // localhost). Si estás probando sobre LAN HTTP, no funciona.
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false
    ) {
      alert(
        "Para compartir necesitás abrir la app desde HTTPS o localhost. Si estás probando desde la red local con http://, probá Descargar — al desplegar a producción funciona normal.",
      );
      return;
    }

    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      alert(
        "Tu navegador no soporta el panel nativo de compartir. Probá Descargar.",
      );
      return;
    }

    const dataUrl = stampedPortrait ?? portrait;
    const file = dataUrlToFile(dataUrl, `retrato-${characterId}.jpg`);
    const shareData: ShareData = {
      title: "Mi Retrato de la Patria",
      text: `Me retraté como ${fullName} de 1810. Imagen generada con IA.`,
      files: [file],
    };

    try {
      haptic("tap");
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        return;
      }
      // Algunos browsers no soportan share con archivos pero sí texto.
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
      });
    } catch (err) {
      // AbortError = el usuario cerró el panel nativo. Silencio.
      if ((err as Error).name === "AbortError") return;
      console.error("[share] error:", err);
      alert(
        "No pudimos abrir el panel de compartir. Probá con Descargar.",
      );
    }
  }

  // Back vive dentro de la BottomActionBar de cada step que la usa (split
  // bar [← back] [CTA]). Camera no necesita back porque es el inicio del
  // flujo; Painting tiene su propio botón "Cancelar"; Result tiene
  // "Probar con otra foto". No hace falta back FAB top-left.

  return (
    <div className={styles.shell}>
      <SolFlash trigger={step} />

      <main className={styles.main} data-step={step}>
        <div key={step} className={styles.step}>
          {step === "camera" && (
            <>
              <LargeTitle
                eyebrow="Paso 1 · El retrato"
                subtitle="Centrá tu cara en el óvalo dorado. Una sola persona en la foto da mejores resultados."
              >
                Posicionate
              </LargeTitle>
              <Camera onPhotoReady={handlePhotoReady} />
            </>
          )}

          {step === "choose" && photo && (
            <>
              <p className={styles.chooseEyebrow}>Paso 2 · El rol</p>
              <div className={styles.chooseTitleGrid}>
                <LargeTitle>¿Quién <em>serás</em>?</LargeTitle>
                <button
                  type="button"
                  className={styles.photoChip}
                  onClick={goCamera}
                  aria-label="Cambiar foto"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" />
                  <span className={styles.photoChipBadge} aria-hidden>
                    <RetakeGlyph />
                  </span>
                </button>
                <p className={styles.chooseSubtitle}>
                  Elegí cómo querés ser pintado en 1810.
                </p>
              </div>
              <ChooseScreen
                gender={gender}
                onGenderChange={(g) => {
                  setGender(g);
                  // Si la selección actual está restringida al otro género,
                  // limpiarla. Caso: tenías Patricio (caballero) seleccionado
                  // y cambiás a dama → el rol no aplica, deseleccionamos.
                  if (characterId) {
                    const c = getCharacterById(characterId);
                    if (c?.genderRestriction && c.genderRestriction !== g) {
                      setCharacterId(null);
                    }
                  }
                }}
                characterId={characterId}
                onCharacterChange={setCharacterId}
                onBack={goCamera}
                onStart={handleStartPaint}
                onEnterDemo={
                  isBillingError(transformError) ? handleEnterDemoMode : null
                }
                shortName={shortName}
                errorMessage={transformError}
              />
            </>
          )}

          {step === "painting" && (
            <>
              <LargeTitle
                eyebrow="Paso 3 · El taller"
                subtitle="El artista no se apura. Esperá unos segundos."
              >
                Pintándote
              </LargeTitle>
              <LoadingState characterName={fullName} />
              <BottomActionBar>
                <button
                  type="button"
                  className={styles.cancelCta}
                  onClick={handleCancelPaint}
                >
                  Cancelar
                </button>
              </BottomActionBar>
            </>
          )}

          {step === "result" && portrait && (
            <>
              <LargeTitle eyebrow="Paso 4 · La galería" align="center">
                Vos en <em>1810</em>
              </LargeTitle>
              <ResultScreen
                portrait={portrait}
                characterName={fullName}
                onDownload={handleDownload}
                onShare={handleShare}
                onRestart={goCamera}
                isDemoMode={isDemoMode}
                burstKey={burstKey}
              />
            </>
          )}
        </div>
      </main>

      {/*
        Target del portal del BottomActionBar. Vive en el .shell, no en
        .main / .step, así la bar nunca termina como descendiente de un
        elemento con animación o transform — eso rompía el position: fixed
        haciendo que la bar se posicionara contra .step en vez del viewport.
      */}
      <div id="bottom-bar-portal" />
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
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  characterId: CharacterId | null;
  onCharacterChange: (id: CharacterId) => void;
  onBack: () => void;
  onStart: () => void;
  onEnterDemo: (() => void) | null;
  shortName: string;
  errorMessage: string | null;
}

function ChooseScreen({
  gender,
  onGenderChange,
  characterId,
  onCharacterChange,
  onBack,
  onStart,
  onEnterDemo,
  shortName,
  errorMessage,
}: ChooseScreenProps) {
  return (
    <div className={styles.choose}>
      <header className={styles.chooseHeader}>
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

      <div className={styles.chooseGrid}>
        <CharacterPicker
          characters={CHARACTERS}
          selectedId={characterId}
          onSelect={onCharacterChange}
          labelFor={(c) => getShortLabel(c, gender)}
          currentGender={gender}
        />
      </div>

      <BottomActionBar>
        <button
          type="button"
          className={styles.ctaBack}
          onClick={onBack}
          aria-label="Volver"
        >
          <BackChevron />
        </button>
        <button
          type="button"
          className={styles.cta}
          onClick={onStart}
          disabled={!characterId}
        >
          {characterId ? `Pintarme como ${shortName}` : "Elegí un rol primero"}
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
        {/* PortraitFrame sin onDownload/onShare → no renderea los botones
            internos. Las acciones viven en la BottomActionBar de abajo
            para unificar UX con el resto del flujo. */}
        <PortraitFrame
          imageDataUrl={portrait}
          characterName={characterName}
          variant="cabildo"
        />
      </div>
      {/*
        Recordatorio de identidad al cierre del flujo — momento "salí
        con tu retrato listo y enterate quién hizo esto". Mismo Footer
        que aparece en el Splash y el TermsGate; consistente.
      */}
      <Footer />

      <BottomActionBar>
        <button
          type="button"
          className={styles.ctaBack}
          onClick={onRestart}
          aria-label="Probar con otra foto"
        >
          <BackChevron />
        </button>
        <button
          type="button"
          className={styles.resultAction}
          onClick={onShare}
        >
          <ShareGlyph />
          <span>Compartir</span>
        </button>
        <button
          type="button"
          className={`${styles.resultAction} ${styles.resultActionPrimary}`}
          onClick={onDownload}
        >
          <DownloadGlyph />
          <span>Descargar</span>
        </button>
      </BottomActionBar>
    </div>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
