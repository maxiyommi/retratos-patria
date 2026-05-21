"use client";

/*
 * TermsGate — bloquea el uso de la app hasta que se acepten los términos.
 *
 * Lee/escribe localStorage con una clave VERSIONADA (TERMS_VERSION_KEY). Si
 * los términos se actualizan, basta con bumpear el sufijo de la clave para
 * volver a pedir aceptación.
 *
 * Recibe el HTML ya pre-renderizado de content/terminos.md (lo parsea el
 * Server Component padre con marked). Renderiza el texto completo en un
 * scroll-container con styling propio.
 *
 * En el primer render (antes de hidratarse y leer localStorage) muestra un
 * placeholder neutro para evitar un "flash de gate" para usuarios que ya
 * aceptaron.
 */

import { useEffect, useState } from "react";
import { SolDeMayo } from "@/components/SolDeMayo";
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

  useEffect(() => {
    // Patrón "leer localStorage post-mount": no podemos hacerlo durante SSR
    // (no hay window). El estado inicial es null y se actualiza una sola vez
    // al hidratarse. La regla react-hooks/set-state-in-effect previene
    // cascadas de renders, pero este caso es lectura única de estado
    // externo: el equivalente "correcto" sería useSyncExternalStore pero es
    // sobre-engineering para un único getter.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccepted(window.localStorage.getItem(TERMS_VERSION_KEY) === "yes");
    } catch {
      // Sin localStorage (privacy mode estricto): tratamos como no aceptado.
      setAccepted(false);
    }
  }, []);

  function handleAccept() {
    try {
      window.localStorage.setItem(TERMS_VERSION_KEY, "yes");
    } catch {
      // ignoramos: si falla, igual avanzamos para esta sesión.
    }
    setAccepted(true);
  }

  // Primer render — placeholder neutro para evitar flash del gate
  if (accepted === null) {
    return <div className={styles.boot} aria-hidden />;
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <header className={styles.header}>
        <SolDeMayo className={styles.sun} aria-hidden />
        <h1 id="terms-title" className={styles.title}>
          Antes de empezar
        </h1>
      </header>

      <ul className={styles.summary}>
        <li>
          No guardamos tu foto en ningún lado. Se procesa y se descarta.
        </li>
        <li>
          La foto se envía momentáneamente a Google Gemini para generar el
          retrato.
        </li>
        <li>
          Si sos menor de edad, necesitás autorización de un adulto
          responsable.
        </li>
        <li>Es un proyecto educativo, sin fines comerciales.</li>
      </ul>

      <details className={styles.details}>
        <summary className={styles.detailsToggle}>
          Leer el texto completo
        </summary>
        <div
          className={styles.fullText}
          // El HTML viene del .md propio del proyecto, parseado server-side
          // con marked. No hay fuente externa = no XSS.
          dangerouslySetInnerHTML={{ __html: termsHtml }}
        />
      </details>

      <button
        type="button"
        className={styles.acceptButton}
        onClick={handleAccept}
      >
        Acepto y continúo
      </button>

      <p className={styles.fineprint}>
        Al continuar aceptás los Términos y el Aviso de Privacidad
        completos.
      </p>
    </div>
  );
}
