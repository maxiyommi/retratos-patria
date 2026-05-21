/*
 * LargeTitle — patrón "iOS large title" para cada paso del flujo.
 *
 * Headline tipográfico que ocupa presencia hero (Cormorant italic
 * grande), con eyebrow opcional arriba (en CAPS muted) y subtitle
 * opcional debajo (body chico, opaco). Anima en entrada con fade
 * + translate + blur-out suave.
 *
 * Reemplaza la idea de "brand bar" como elemento de identidad: ahora
 * cada step se identifica por su título propio, no por una barra
 * persistente con el nombre de la app.
 */

import type { ReactNode } from "react";
import styles from "./LargeTitle.module.css";

export interface LargeTitleProps {
  eyebrow?: string;
  children: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
}

export function LargeTitle({
  eyebrow,
  children,
  subtitle,
  align = "left",
}: LargeTitleProps) {
  return (
    <header className={styles.root} data-align={align}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{children}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
