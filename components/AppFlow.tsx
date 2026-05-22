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
 * Compone el "cuadro completo" listo para descargar o compartir: el
 * retrato del usuario dentro de un marco dorado tipo museo, una cartela
 * de pergamino con el nombre del personaje, la inscripción "Imagen
 * generada con IA" en la esquina del retrato, y la marca "Retratos de
 * la Patria" al pie. Replica visualmente al PortraitFrame del DOM en
 * un solo canvas para que el archivo descargado se sienta como una
 * obra exhibida, no como un screenshot del rostro.
 *
 * Se llama en useEffect apenas llega el retrato, así el resultado queda
 * cacheado y los handlers download/share son síncronos respecto al click
 * (importante para preservar la "user activation" que requiere
 * navigator.share en Safari/Chrome mobile).
 */
function composeFramedPortrait(
  portraitDataUrl: string,
  characterName: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Recorte cuadrado del retrato original (Gemini suele devolver
        // imágenes ya cuadradas pero nos protegemos).
        const srcSide = Math.min(img.naturalWidth, img.naturalHeight);
        const srcX = (img.naturalWidth - srcSide) / 2;
        const srcY = (img.naturalHeight - srcSide) / 2;
        const innerSize = srcSide; // tamaño final del retrato dentro del marco

        // Geometría del cuadro compuesto
        const goldPad = Math.round(innerSize * 0.06); // ancho del marco dorado
        const matPad = Math.round(innerSize * 0.015); // mata sepia entre marco e imagen
        const cartelaH = Math.round(innerSize * 0.11);
        const brandStripH = Math.round(innerSize * 0.13);

        const canvasW = innerSize + (goldPad + matPad) * 2;
        const frameInnerH = innerSize + (goldPad + matPad) * 2;
        const canvasH = frameInnerH + cartelaH + brandStripH;

        const canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Fondo: pared de museo (celeste profundo del chrome).
        ctx.fillStyle = "#143b5a";
        ctx.fillRect(0, 0, canvasW, canvasH);

        // ── Marco dorado ──────────────────────────────────────────
        const goldGrad = ctx.createLinearGradient(0, 0, canvasW, frameInnerH);
        goldGrad.addColorStop(0, "#e7ce8e");
        goldGrad.addColorStop(0.38, "#c9a14a");
        goldGrad.addColorStop(0.62, "#a87f37");
        goldGrad.addColorStop(1, "#c9a14a");
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, 0, canvasW, frameInnerH);

        // Bisel del marco — TRES líneas concéntricas para dar profundidad
        // tipo tallado: exterior oscura gruesa, intermedia clara, interior
        // oscura. Replica el look del marco DOM con shadow-marco + insets.
        // 1) Hilo exterior oscuro grueso (el borde tallado)
        ctx.strokeStyle = "rgba(40, 24, 14, 0.85)";
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, canvasW - 3, frameInnerH - 3);
        // 2) Filete intermedio en dorado claro a 6px de adentro (highlight)
        ctx.strokeStyle = "rgba(231, 206, 142, 0.55)";
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 6, canvasW - 12, frameInnerH - 12);
        // 3) Hilo interior oscuro al borde de la mata (donde se hunde la imagen)
        ctx.strokeStyle = "rgba(40, 24, 14, 0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          goldPad - 1,
          goldPad - 1,
          innerSize + matPad * 2 + 2,
          innerSize + matPad * 2 + 2,
        );
        // 4) Sombra interna sutil sobre el dorado adyacente a la mata
        //    (imita la profundidad del bisel hacia adentro)
        const innerShadow = ctx.createLinearGradient(0, goldPad - 8, 0, goldPad + 8);
        innerShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
        innerShadow.addColorStop(1, "rgba(40, 24, 14, 0.35)");
        ctx.fillStyle = innerShadow;
        ctx.fillRect(goldPad - 8, goldPad - 8, innerSize + matPad * 2 + 16, 8);

        // ── Ornamentos en las cuatro esquinas — flor de 4 pétalos al ──
        //    estilo de los SVG del DOM. Reemplaza los "tornillos" que
        //    parecían remaches de pared.
        const cornerInset = Math.round(goldPad * 0.45);
        const cornerSize = Math.round(goldPad * 0.42);
        const corners: Array<[number, number]> = [
          [cornerInset, cornerInset],
          [canvasW - cornerInset, cornerInset],
          [cornerInset, frameInnerH - cornerInset],
          [canvasW - cornerInset, frameInnerH - cornerInset],
        ];
        corners.forEach(([cx, cy]) => {
          drawCornerFlourish(ctx, cx, cy, cornerSize);
        });

        // ── Mata sepia (passe-partout) ────────────────────────────
        const matX = goldPad;
        const matY = goldPad;
        const matW = innerSize + matPad * 2;
        const matH = innerSize + matPad * 2;
        ctx.fillStyle = "#6b4a2b";
        ctx.fillRect(matX, matY, matW, matH);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(matX + 0.5, matY + 0.5, matW - 1, matH - 1);

        // ── Retrato del usuario ───────────────────────────────────
        const imgX = goldPad + matPad;
        const imgY = goldPad + matPad;
        ctx.drawImage(img, srcX, srcY, srcSide, srcSide, imgX, imgY, innerSize, innerSize);

        // Banda gradient + "Imagen generada con IA" sobre el ángulo inf. der.
        const noticeBandY = imgY + innerSize * 0.88;
        const noticeBandH = innerSize * 0.12;
        const noticeBandGrad = ctx.createLinearGradient(0, noticeBandY, 0, noticeBandY + noticeBandH);
        noticeBandGrad.addColorStop(0, "rgba(0,0,0,0)");
        noticeBandGrad.addColorStop(1, "rgba(0,0,0,0.45)");
        ctx.fillStyle = noticeBandGrad;
        ctx.fillRect(imgX, noticeBandY, innerSize, noticeBandH);
        const noticeFont = Math.round(innerSize * 0.022);
        ctx.fillStyle = "rgba(251, 247, 236, 0.95)";
        ctx.font = `italic ${noticeFont}px "EB Garamond", Georgia, serif`;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "right";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 4;
        ctx.fillText(
          "Imagen generada con IA",
          imgX + innerSize - Math.round(innerSize * 0.025),
          imgY + innerSize - Math.round(innerSize * 0.015),
        );
        ctx.shadowBlur = 0;

        // ── Cartela pergamino con el nombre del personaje ────────
        // La cartela "monta" un poco sobre el marco como en el DOM —
        // empieza dentro del frame inferior y se extiende por debajo.
        const cartelaInsetX = Math.round(canvasW * 0.08);
        const cartelaX = cartelaInsetX;
        const cartelaY = frameInnerH - Math.round(cartelaH * 0.35);
        const cartelaW = canvasW - cartelaInsetX * 2;
        const cartelaActualH = cartelaH;

        // Sombra cálida de la cartela
        ctx.fillStyle = "rgba(58, 38, 24, 0.45)";
        ctx.fillRect(cartelaX + 4, cartelaY + 6, cartelaW, cartelaActualH);

        // Cuerpo pergamino
        ctx.fillStyle = "#efe1bf";
        ctx.fillRect(cartelaX, cartelaY, cartelaW, cartelaActualH);
        // Hilo dorado interior
        ctx.strokeStyle = "rgba(231, 206, 142, 0.85)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cartelaX + 2, cartelaY + 2, cartelaW - 4, cartelaActualH - 4);
        // Borde sepia
        ctx.strokeStyle = "#6b4a2b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cartelaX, cartelaY, cartelaW, cartelaActualH);

        // Nombre del personaje (Cormorant italic)
        const nameFont = Math.round(cartelaActualH * 0.42);
        ctx.fillStyle = "#3a2618";
        ctx.font = `italic 500 ${nameFont}px "Cormorant Garamond", Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          characterName,
          cartelaX + cartelaW / 2,
          cartelaY + cartelaActualH / 2,
        );

        // ── Strip inferior con la marca "Retratos de la Patria" ──
        const brandStripY = frameInnerH + cartelaH;
        ctx.fillStyle = "#143b5a";
        ctx.fillRect(0, brandStripY, canvasW, brandStripH);

        // Filete dorado fino al tope del strip — separa la banda del cuadro.
        ctx.fillStyle = "rgba(231, 206, 142, 0.55)";
        ctx.fillRect(0, brandStripY, canvasW, 1);
        ctx.fillStyle = "rgba(231, 206, 142, 0.28)";
        ctx.fillRect(0, brandStripY + 1, canvasW, 1);

        // Sol de Mayo chiquito a la izquierda del wordmark
        const sunR = Math.round(brandStripH * 0.18);
        const brandFont = Math.round(brandStripH * 0.4);
        const sunGap = Math.round(brandFont * 0.5);
        const part1 = "Retratos";
        const part2 = "de la Patria";
        ctx.font = `italic 600 ${brandFont}px "Cormorant Garamond", Georgia, serif`;
        const w1 = ctx.measureText(part1).width;
        const innerGap = Math.round(brandFont * 0.4);
        const w2 = ctx.measureText(part2).width;
        const totalW = sunR * 2 + sunGap + w1 + innerGap + w2;
        const startX = (canvasW - totalW) / 2;
        const brandBaselineY = brandStripY + brandStripH / 2;

        // Sol: disco dorado + 8 rayos cortos alternados.
        const sunCx = startX + sunR;
        const sunCy = brandBaselineY;
        const rayLen = Math.round(sunR * 0.85);
        ctx.strokeStyle = "#e7ce8e";
        ctx.lineWidth = Math.max(1.5, sunR * 0.15);
        ctx.lineCap = "round";
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const startR = sunR + 2;
          const endR = sunR + 2 + rayLen;
          ctx.beginPath();
          ctx.moveTo(
            sunCx + Math.cos(angle) * startR,
            sunCy + Math.sin(angle) * startR,
          );
          ctx.lineTo(
            sunCx + Math.cos(angle) * endR,
            sunCy + Math.sin(angle) * endR,
          );
          ctx.stroke();
        }
        ctx.fillStyle = "#c9a14a";
        ctx.beginPath();
        ctx.arc(sunCx, sunCy, sunR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e7ce8e";
        ctx.beginPath();
        ctx.arc(sunCx, sunCy, sunR * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Wordmark: "Retratos" blanco cálido + "de la Patria" dorado suave.
        const wordmarkX = startX + sunR * 2 + sunGap;
        ctx.font = `italic 600 ${brandFont}px "Cormorant Garamond", Georgia, serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillStyle = "#fbf7ec";
        ctx.fillText(part1, wordmarkX, brandBaselineY);
        ctx.fillStyle = "#e7ce8e";
        ctx.fillText(part2, wordmarkX + w1 + innerGap, brandBaselineY);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("img load failed"));
    img.src = portraitDataUrl;
  });
}

/**
 * Dibuja un ornamento de "flor de 4 pétalos" en una esquina del marco,
 * matcheando la silueta de los SVG decorativos del PortraitFrame del DOM.
 * Reemplaza los "tornillos" anteriores que parecían remaches.
 */
function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const r = size / 2;
  const petalLen = r * 0.95;
  const petalWidth = r * 0.42;

  // 4 pétalos en forma de gota apuntando a cada eje cardinal.
  ctx.fillStyle = "#e7ce8e";
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2; // 0, 90, 180, 270
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      petalWidth, -petalLen * 0.2,
      petalWidth * 0.4, -petalLen,
      0, -petalLen,
    );
    ctx.bezierCurveTo(
      -petalWidth * 0.4, -petalLen,
      -petalWidth, -petalLen * 0.2,
      0, 0,
    );
    ctx.closePath();
    ctx.fill();
    // Sombra interior sutil al pétalo (sentido del relieve)
    ctx.strokeStyle = "rgba(58, 38, 24, 0.35)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
  // Disco central que cubre el cruce de los pétalos
  ctx.fillStyle = "#c9a14a";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(58, 38, 24, 0.55)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
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

  /**
   * Volver a la galería de personajes preservando la foto. Útil desde
   * el resultado: el usuario ya hizo el esfuerzo de sacarse la foto y
   * sólo quiere probar otro rol con la misma imagen.
   *
   * Confirma antes de navegar — el retrato generado se pierde (no
   * persistimos nada en memoria del navegador). Si el usuario quería
   * conservarlo, debería haberlo descargado o compartido antes.
   */
  function goChooseFromResult() {
    const ok = window.confirm(
      "Si volvés atrás vas a perder este retrato. ¿Querés continuar?",
    );
    if (!ok) return;
    transitionState(() => {
      setStep("choose");
      // Limpiar lo del resultado pero NO la foto ni el rol elegido —
      // el usuario vuelve al picker con su selección anterior aún
      // resaltada, lista para elegir otra si quiere.
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
   * framedPortrait: versión del retrato compuesta dentro del cuadro
   * dorado completo (marco + mata sepia + cartela con el nombre +
   * inscripción IA + marca "Retratos de la Patria" al pie). Se
   * pre-computa apenas llega el retrato y se cachea, así cuando el
   * usuario toca Descargar/Compartir el handler es prácticamente
   * síncrono y el browser conserva el 'user activation' que pide
   * navigator.share en Safari/Chrome mobile.
   */
  const [framedPortrait, setFramedPortrait] = useState<string | null>(null);

  useEffect(() => {
    if (!portrait) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFramedPortrait(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const framed = await composeFramedPortrait(portrait, fullName);
        if (!cancelled) setFramedPortrait(framed);
      } catch {
        if (!cancelled) setFramedPortrait(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portrait, fullName]);

  function handleDownload() {
    if (!portrait) return;
    try {
      const dataUrl = framedPortrait ?? portrait;
      const file = dataUrlToFile(dataUrl, `retratos-de-la-patria-${characterId}.jpg`);
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

    const dataUrl = framedPortrait ?? portrait;
    const file = dataUrlToFile(dataUrl, `retratos-de-la-patria-${characterId}.jpg`);
    const shareData: ShareData = {
      title: "Retratos de la Patria",
      text: `Me retraté como ${fullName} con Retratos de la Patria. Imagen generada con IA.`,
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
              <LargeTitle eyebrow="Paso 4 · La galería">
                Vos en <em>1810</em>
              </LargeTitle>
              <ResultScreen
                portrait={portrait}
                characterName={fullName}
                onDownload={handleDownload}
                onShare={handleShare}
                onRestart={goChooseFromResult}
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
        {/* Pedestal / piso de galería: sombra elíptica sutil bajo el marco
            que sugiere apoyo físico, como si el cuadro estuviera sobre un
            atril en un museo. */}
        <div className={styles.galleryPedestal} aria-hidden />
        {/* Cortinas de terciopelo que se abren al entrar al step,
            revelando el cuadro como en una inauguración de museo. Animan
            una vez al mount; después quedan off-screen (forwards). */}
        <div className={`${styles.curtain} ${styles.curtainLeft}`} aria-hidden />
        <div className={`${styles.curtain} ${styles.curtainRight}`} aria-hidden />
      </div>

      <BottomActionBar>
        <button
          type="button"
          className={styles.ctaBack}
          onClick={onRestart}
          aria-label="Elegir otro rol"
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
