"use client";

/*
 * TermsGate — bloquea el uso de la app hasta que se acepten los términos.
 *
 * Diseñado como una "Real Cédula" digital: ornamentos coloniales, drop-cap
 * en el título, divisor con flourish, Sol de Mayo arriba, franja dorada
 * interior. Cabe en 100dvh sin scroll (el texto completo se despliega en
 * un <details> con scroll interno limitado).
 *
 * Persistencia: localStorage versionado con TERMS_VERSION_KEY. Si los
 * términos se actualizan, bumpear el sufijo de la clave para re-pedir
 * aceptación.
 *
 * Al aceptar: transición fade-out + scale, después se monta el children
 * (la app real). En browsers con View Transitions, se usa para que el
 * cambio sea aún más fluido.
 */

import { useEffect, useRef, useState } from "react";
import { SolDeMayo } from "@/components/SolDeMayo";
import { BottomActionBar } from "@/components/BottomActionBar";
import { haptic } from "@/lib/haptic";
import { transitionState } from "@/lib/transition";
import styles from "./TermsGate.module.css";

const TERMS_VERSION_KEY = "terminos_aceptados_v1";

export interface TermsGateProps {
  /** HTML pre-renderizado desde content/terminos.md. */
  termsHtml: string;
  children: React.ReactNode;
}

export function TermsGate({ termsHtml, children }: TermsGateProps) {
  // null = aún no leímos localStorage (durante SSR/primer render)
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccepted(window.localStorage.getItem(TERMS_VERSION_KEY) === "yes");
    } catch {
      setAccepted(false);
    }
  }, []);

  function openSheet() {
    haptic("tap");
    sheetRef.current?.showModal();
  }

  function closeSheet() {
    sheetRef.current?.close();
  }

  /*
   * Bottom-sheet pattern: el backdrop del <dialog> ocupa la pantalla
   * entera. Si el tap cae en el dialog mismo (no en su contenido), es
   * porque el usuario tocó el área de fondo y queremos cerrar.
   */
  function handleSheetClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === sheetRef.current) closeSheet();
  }

  function handleAccept() {
    haptic("success");
    try {
      window.localStorage.setItem(TERMS_VERSION_KEY, "yes");
    } catch {
      // ignoramos: si falla, igual avanzamos para esta sesión.
    }
    transitionState(() => setAccepted(true), "forward");
  }

  if (accepted === null) {
    return <div className={styles.boot} aria-hidden />;
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <header className={styles.header}>
        <SolDeMayo className={styles.sun} aria-hidden />
        <h1 id="terms-title" className={styles.title}>
          <span className={styles.titleDropcap}>A</span>ntes de{" "}
          <em>empezar</em>
        </h1>
        <div className={styles.flourish} aria-hidden>
          <span className={styles.flourishLine} />
          <FlourishMark />
          <span className={styles.flourishLine} />
        </div>
      </header>

      <ul className={styles.summary}>
        <li>
          <strong>No guardamos tu foto.</strong> Se procesa y se descarta.
        </li>
        <li>
          La foto se manda a Google Gemini un instante para generar el
          retrato.
        </li>
        <li>
          Si sos menor, necesitás autorización de un adulto responsable.
        </li>
        <li>
          Proyecto educativo de código abierto, sin fines comerciales.{" "}
          <a
            className={styles.summaryLink}
            href="https://github.com/maxiyommi/retratos-patria"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver el código en GitHub
          </a>
          .
        </li>
      </ul>

      <button
        type="button"
        className={styles.openSheet}
        onClick={openSheet}
        aria-haspopup="dialog"
      >
        <span>Leer el texto completo</span>
        <UpArrowGlyph />
      </button>

      {/*
        Bottom sheet nativo con <dialog>. Slide-up desde abajo con animación
        de resorte, backdrop oscurecido con blur, drag handle decorativo
        arriba, cierre por backdrop tap, botón × o ESC.
      */}
      <dialog
        ref={sheetRef}
        className={styles.sheet}
        onClick={handleSheetClick}
        aria-labelledby="terms-sheet-title"
      >
        <div className={styles.sheetInner}>
          <span className={styles.sheetHandle} aria-hidden />
          <header className={styles.sheetHeader}>
            <h2 id="terms-sheet-title" className={styles.sheetTitle}>
              Términos y Aviso de Privacidad
            </h2>
            <button
              type="button"
              className={styles.sheetClose}
              onClick={closeSheet}
              aria-label="Cerrar"
            >
              <CloseGlyph />
            </button>
          </header>
          <div
            className={styles.sheetBody}
            // HTML del .md propio del proyecto, parseado server-side con
            // marked. No hay fuente externa = no XSS.
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        </div>
      </dialog>

      {/*
        Portal target para el BottomActionBar — sin esto, la bar no
        encuentra dónde montarse mientras el TermsGate está abierto
        (AppFlow aún no se renderizó). Mismo id que usa el AppFlow.
      */}
      <div id="bottom-bar-portal" />

      <BottomActionBar>
        <button
          type="button"
          className={styles.acceptButton}
          onClick={handleAccept}
        >
          Acepto y continúo
        </button>
      </BottomActionBar>
    </div>
  );
}

/* ── Ornamento de divisor — pluma estilizada ───────────────────────── */

function FlourishMark() {
  return (
    <svg
      viewBox="0 0 28 14"
      width="28"
      height="14"
      className={styles.flourishSvg}
      aria-hidden
    >
      <path
        d="M 2 7 Q 8 1 14 7 Q 20 13 26 7"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="14" cy="7" r="1.4" fill="currentColor" />
    </svg>
  );
}

function UpArrowGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
    >
      <path
        d="M 8 11 L 8 4 M 4 7 L 8 4 L 12 7"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path
        d="M 4 4 L 12 12 M 12 4 L 4 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
