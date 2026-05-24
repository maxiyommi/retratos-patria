import type { NextConfig } from "next";

/*
 * Headers de seguridad globales.
 *
 * - X-Frame-Options DENY + CSP frame-ancestors 'none': impide embebido en
 *   iframes (anti-clickjacking; relevante por la cámara y por procesar
 *   fotos de menores).
 * - Permissions-Policy: la cámara sólo puede usarla este origen; el resto
 *   (mic, geo, etc.) bloqueado.
 * - Referrer-Policy: no leakear el path completo a destinos cross-origin.
 * - HSTS: forzar HTTPS por 2 años.
 * - X-Content-Type-Options: nosniff para evitar MIME confusion.
 * - CSP conservadora — la única request externa que hace el CLIENTE es
 *   a Vercel Analytics (script + endpoint de eventos); todo lo demás
 *   (Gemini) lo hace el server-side.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      // va.vercel-scripts.com sirve el script de Vercel Analytics.
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "font-src 'self' data:",
      // /_vercel/insights/* (mismo origen) y vitals.vercel-insights.com
      // reciben los eventos de Analytics y Speed Insights.
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const devLanIp = process.env.DEV_LAN_IP;

const nextConfig: NextConfig = {
  // Permitir requests cross-origin desde el celular en la misma wifi durante
  // dev. Setear DEV_LAN_IP en .env.local (ej: DEV_LAN_IP=192.168.0.16).
  allowedDevOrigins: devLanIp ? [devLanIp] : [],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
