/*
 * Imagen OpenGraph que se muestra cuando se comparte el link en WhatsApp,
 * Telegram, Twitter/X, LinkedIn, Facebook, Slack, iMessage, etc.
 *
 * Next.js App Router detecta automáticamente `app/opengraph-image.tsx` y
 * la convierte en un endpoint que genera el PNG con `next/og` (satori +
 * resvg). El runtime corre en Node por defecto en Next 16.
 *
 * Diseño: celeste profundo con halo dorado superior + Sol de Mayo dorado
 * + wordmark Cormorant italic + subtítulo + firma de autor.
 *
 * Carga de tipografía: satori no soporta woff2 ni system fonts (no tiene
 * acceso a las fuentes del SO). Resolución: pedirle a Google Fonts el CSS
 * con User-Agent "curl/7.0" (UA viejo) — devuelve un .ttf directo
 * (formato 'truetype') en vez de woff2, que sí soporta satori.
 */

import { ImageResponse } from "next/og";

export const alt =
  "Retratos de la Patria — sacate una foto y mirate como una figura de la Buenos Aires colonial de 1810.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Descarga la TTF de Cormorant Garamond MediumItalic desde Google Fonts.
 * Truco del User-Agent: con un UA antiguo Google sirve TTF en vez de
 * woff2 (que satori no entiende). Si la red falla devolvemos null y
 * ImageResponse cae al default de satori (sans bundleado).
 */
async function loadFont(weight: "500" | "600", style: "italic"): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css?family=Cormorant+Garamond:${weight}${style === "italic" ? "i" : ""}`,
      { headers: { "User-Agent": "curl/7.0" } },
    );
    const css = await cssRes.text();
    const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const [italic500, italic600] = await Promise.all([
    loadFont("500", "italic"),
    loadFont("600", "italic"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // flex-start arriba; el byline se ancla al pie con marginTop:auto
          // para que el spacing sea limpio sin overlap.
          justifyContent: "flex-start",
          padding: "70px 80px 60px",
          // Misma estética que el step splash de la app: celeste de cielo,
          // halo dorado arriba sugiriendo amanecer/Sol de Mayo.
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(231, 206, 142, 0.38) 0%, rgba(91, 158, 206, 0) 55%), linear-gradient(180deg, #5b9ece 0%, #2f6f9b 100%)",
          backgroundColor: "#2f6f9b",
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          color: "#fbf7ec",
        }}
      >
        {/* Sol de Mayo estilizado — disco dorado central con rayos
            triangulares alternados (16 rayos: 8 rectos + 8 diagonales). */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            marginBottom: 10,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 14,
                height: 70,
                background: "#e7ce8e",
                top: 0,
                left: "50%",
                transformOrigin: "50% 110px",
                transform: `translateX(-50%) rotate(${(i * 360) / 16}deg)`,
                borderRadius: 4,
                opacity: i % 2 === 0 ? 0.95 : 0.7,
              }}
            />
          ))}
          {/* Disco central con dos anillos para sugerir cara del sol. */}
          <div
            style={{
              position: "relative",
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "#c9a14a",
              boxShadow: "0 0 60px rgba(231, 206, 142, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: "50%",
                background: "#e7ce8e",
                display: "flex",
              }}
            />
          </div>
        </div>

        {/* Wordmark — Retratos de la Patria, italic display. */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            fontStyle: "italic",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 28,
            textShadow: "0 4px 28px rgba(15, 38, 60, 0.45)",
          }}
        >
          <span style={{ fontSize: 128, color: "#fbf7ec" }}>Retratos</span>
          <span style={{ fontSize: 86, color: "#e7ce8e" }}>de la Patria</span>
        </div>

        {/* Subtítulo descriptivo en serif italic más chico. */}
        <div
          style={{
            display: "flex",
            fontSize: 38,
            fontStyle: "italic",
            fontWeight: 500,
            color: "#fbf7ec",
            opacity: 0.92,
            textAlign: "center",
            maxWidth: 1000,
            lineHeight: 1.35,
          }}
        >
          Sacate una foto y mirate como una figura de la Buenos Aires de 1810.
        </div>

        {/* Firma de autoría al pie del flex. marginTop:auto absorbe el
            espacio sobrante y lo planta en el borde inferior con respiración
            adecuada respecto al subtítulo. */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            fontSize: 26,
            fontStyle: "italic",
            fontWeight: 500,
            color: "#e7ce8e",
            opacity: 0.88,
            letterSpacing: "0.02em",
          }}
        >
          Proyecto de código abierto · Maximiliano Yommi
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        italic500
          ? {
              name: "Cormorant Garamond",
              data: italic500,
              style: "italic" as const,
              weight: 500 as const,
            }
          : null,
        italic600
          ? {
              name: "Cormorant Garamond",
              data: italic600,
              style: "italic" as const,
              weight: 600 as const,
            }
          : null,
      ].filter((f): f is NonNullable<typeof f> => f !== null),
    },
  );
}
