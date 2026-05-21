import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir requests cross-origin desde el celular en la misma wifi durante
  // dev (para probar la cámara en un dispositivo real).
  allowedDevOrigins: ["192.168.0.16"],
};

export default nextConfig;
