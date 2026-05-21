/*
 * page.tsx — Server Component raíz.
 *
 * Estructura visual de arriba hacia abajo (z-index ascendente):
 *   - BanderaAccent: franja celeste/blanco/celeste sutil al pie, animada
 *     con onda. Identidad argentina ambiente, decorativa.
 *   - AppFlow (envuelto por TermsGate): el contenido funcional.
 *   - Splash: cubre todo durante ~1.2s al cargar, fade out. Sólo se ve
 *     en cold loads (refresh / abrir desde home screen).
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
import { BanderaAccent } from "@/components/BanderaAccent";

export default async function Page() {
  const termsHtml = await loadTermsHtml();
  return (
    <>
      <BanderaAccent />
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
