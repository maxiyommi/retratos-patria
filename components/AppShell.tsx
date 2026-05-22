"use client";

/*
 * AppShell — wrapper client component que controla el orden de montaje
 * entre Splash, TermsGate y AppFlow.
 *
 * Por qué existe: el AppFlow contiene la Camera y la Camera, al montar,
 * pide permiso de cámara (getUserMedia) en el useEffect. Si renderizamos
 * AppFlow detrás del Splash desde el inicio (como hacía antes la page.tsx),
 * la cámara se prende AUNQUE el usuario todavía está mirando el Splash.
 *
 * Solución: tener splashDismissed como state. TermsGate + AppFlow sólo se
 * montan cuando el Splash ya se cerró. El Splash siempre se monta primero
 * y avisa via onDismissed cuando termina su animación de salida.
 */

import { useState } from "react";
import { Splash } from "@/components/Splash";
import { TermsGate } from "@/components/TermsGate";
import { AppFlow } from "@/components/AppFlow";

export interface AppShellProps {
  termsHtml: string;
}

export function AppShell({ termsHtml }: AppShellProps) {
  const [splashDismissed, setSplashDismissed] = useState(false);

  return (
    <>
      {/* TermsGate + AppFlow se montan SÓLO después de cerrar Splash. */}
      {splashDismissed && (
        <TermsGate termsHtml={termsHtml}>
          <AppFlow />
        </TermsGate>
      )}
      <Splash onDismissed={() => setSplashDismissed(true)} />
    </>
  );
}
