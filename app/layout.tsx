import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/tokens.css";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://retratos-patria.vercel.app";
const SITE_TITLE = "Retratos de la Patria";
const SITE_DESCRIPTION =
  "Sacate una foto y mirate como una figura de la Buenos Aires colonial de 1810. Webapp educativa, gratuita y de código abierto.";

export const metadata: Metadata = {
  // metadataBase resuelve URLs relativas (como /opengraph-image) a URLs
  // absolutas, que es lo que las redes sociales necesitan para previsualizar.
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  /*
   * PWA install deshabilitado deliberadamente:
   * - sin `manifest` → Chrome no muestra el prompt "Instalar app".
   * - sin `appleWebApp` → Safari iOS no ofrece "Añadir a pantalla
   *   principal" como app standalone.
   * - sin `apple-mobile-web-app-capable` en `other` (mismo motivo).
   * La app vive como sitio web normal; no queremos pedirle al usuario
   * que la instale.
   */
  applicationName: SITE_TITLE,
  authors: [{ url: "https://github.com/maxiyommi/retratos-patria" }],
  keywords: [
    "Semana de Mayo",
    "Revolución de Mayo",
    "1810",
    "Buenos Aires colonial",
    "retrato IA",
    "educación",
    "Argentina",
    "código abierto",
  ],
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  // Iconos: Next App Router los detecta automáticamente desde:
  //   - app/favicon.ico  (multi-resolución 16/32/48/64 con Sol simplificado)
  //   - app/icon.svg     (Sol detallado, browsers modernos lo escalan crisp)
  //   - app/apple-icon.png (180x180 para iOS, diseño detallado)
  // No hace falta declarar `icons` acá; Next genera los <link> en el HTML.
  /*
   * OpenGraph + Twitter Card: lo que WhatsApp, Telegram, iMessage, Slack,
   * Twitter/X, LinkedIn, Facebook y Discord usan para construir el preview
   * cuando se comparte el link. La imagen la genera app/opengraph-image.tsx
   * vía next/og — Next la sirve automáticamente bajo /opengraph-image y
   * la inyecta en og:image y twitter:image.
   */
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#5b9ece",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${ebGaramond.variable}`}>
      <body>
        {children}
        {/*
          Vercel Analytics: cuenta page views y visitantes únicos sin
          cookies y sin recolectar PII (sólo un hash temporal de IP).
          Activo sólo en producción (Vercel) — `vercel dev` y `next dev`
          NO emiten eventos por default. Política declarada en
          content/terminos.md.
        */}
        <Analytics />
      </body>
    </html>
  );
}
