/*
 * page.tsx — Server Component raíz.
 *
 * Estructura visual:
 *   - AppFlow (envuelto por TermsGate): el contenido funcional. El AppFlow
 *     setea html[data-step] cada vez que cambia de paso; las reglas en
 *     globals.css cambian el background atmosférico por step.
 *   - Splash: cubre todo durante ~1.2s al cargar, fade out. Sólo se ve
 *     en cold loads (refresh / abrir desde home screen).
 *
 * BanderaAccent removida: era decoración permanente al pie, lenguaje web.
 * La identidad argentina ahora aparece en momentos clave (Splash inicial,
 * SolFlash entre steps, Sol de Mayo en LoadingState y TermsGate) — no
 * como adorno fijo.
 *
 * Lee content/terminos.md y lo parsea a HTML server-side con marked,
 * para pasárselo al TermsGate sin que el cliente reciba la librería.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { TermsGate } from "@/components/TermsGate";
import { AppFlow } from "@/components/AppFlow";
import { Splash } from "@/components/Splash";

export default async function Page() {
  const termsHtml = await loadTermsHtml();
  return (
    <>
      <TermsGate termsHtml={termsHtml}>
        <AppFlow />
      </TermsGate>
      <Splash />
    </>
  );
}

async function loadTermsHtml(): Promise<string> {
  const mdPath = path.join(process.cwd(), "content", "terminos.md");
  const md = await fs.readFile(mdPath, "utf-8");
  return await marked.parse(md);
}
