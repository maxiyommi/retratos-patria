/*
 * page.tsx — Server Component raíz.
 *
 * Lee content/terminos.md desde disco, lo parsea a HTML con marked, y se
 * lo pasa al TermsGate (Client Component) que decide si mostrar el gate o
 * continuar al AppFlow.
 *
 * El parseo de markdown ocurre server-side: el cliente nunca recibe el
 * markdown crudo ni la librería marked.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { TermsGate } from "@/components/TermsGate";
import { AppFlow } from "@/components/AppFlow";

export default async function Page() {
  const termsHtml = await loadTermsHtml();
  return (
    <TermsGate termsHtml={termsHtml}>
      <AppFlow />
    </TermsGate>
  );
}

async function loadTermsHtml(): Promise<string> {
  const mdPath = path.join(process.cwd(), "content", "terminos.md");
  const md = await fs.readFile(mdPath, "utf-8");
  return await marked.parse(md);
}
