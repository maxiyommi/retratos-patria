"use client";

/*
 * BottomActionBar — patrón de CTA pegada al pie con glass effect.
 *
 * El equivalente del "primary action button" de iOS Sheets / Android
 * Bottom App Bar. Respeta safe-area-inset-bottom (barra de gestos),
 * tiene backdrop blur sobre el contenido que pasa por debajo, y un
 * hilo dorado arriba que la separa del contenido.
 *
 * Render via createPortal a un target estable del shell (#bottom-bar-portal,
 * inyectado por AppFlow). Esto saca la bar del subárbol del .step que
 * tiene animación de entrada — si la bar vive dentro de .step y .step
 * tiene transform (durante el step-fade-in o el View Transitions slide),
 * la bar position:fixed pierde el viewport como containing block y se
 * posiciona mal. Con portal está siempre fuera de cualquier subárbol
 * animado.
 */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./BottomActionBar.module.css";

export interface BottomActionBarProps {
  children: ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // El target lo planta AppFlow en su .shell. Si todavía no está, el
    // hook re-corre cuando el DOM esté listo (caso edge de SSR/hidratación).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById("bottom-bar-portal"));
  }, []);

  if (!target) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.inner}>{children}</div>
    </div>,
    target,
  );
}
