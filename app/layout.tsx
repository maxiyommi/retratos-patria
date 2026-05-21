import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Retratos de la Patria",
  description:
    "Webapp educativa: retratá tu cara como una figura de la Buenos Aires colonial de 1810.",
  manifest: "/manifest.webmanifest",
  applicationName: "Retratos de la Patria",
  appleWebApp: {
    capable: true,
    title: "Retratos 1810",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
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
      <body>{children}</body>
    </html>
  );
}
