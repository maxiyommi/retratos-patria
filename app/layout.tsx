import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retratos de la Patria",
  description:
    "Webapp educativa: retratá tu cara como una figura de la Buenos Aires colonial de 1810.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
