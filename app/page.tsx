/*
 * page.tsx — Server Component raíz.
 *
 * Estructura visual orquestada por AppShell (client component):
 *   1. Splash al cargar (animación + click "Ingresar")
 *   2. TermsGate (si todavía no se aceptaron los términos)
 *   3. AppFlow (el contenido funcional con la Camera y los steps)
 *
 * AppShell vive en el cliente porque tiene state: el Splash dismiss
 * controla cuándo montar TermsGate + AppFlow. Sin ese gate la Camera
 * dentro de AppFlow pedía permiso de cámara apenas se cargaba la
 * página, mientras el usuario todavía miraba el Splash.
 *
 * Lee content/terminos.md y lo parsea a HTML server-side con marked,
 * para pasárselo al AppShell → TermsGate sin que el cliente reciba la
 * librería.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { AppShell } from "@/components/AppShell";

export default async function Page() {
  const termsHtml = await loadTermsHtml();
  return <AppShell termsHtml={termsHtml} />;
}

async function loadTermsHtml(): Promise<string> {
  const mdPath = path.join(process.cwd(), "content", "terminos.md");
  const md = await fs.readFile(mdPath, "utf-8");
  return await marked.parse(md);
}
