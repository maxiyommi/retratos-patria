/*
 * BottomActionBar — patrón de CTA pegada al pie con glass effect.
 *
 * El equivalente del "primary action button" de iOS Sheets / Android
 * Bottom App Bar. Respeta safe-area-inset-bottom (barra de gestos),
 * tiene backdrop blur sobre el contenido que pasa por debajo, y un
 * hilo dorado arriba que la separa del contenido.
 *
 * Se usa en el step "choose" para que la CTA "Pintarme como…"
 * siempre sea visible sin scrollear. El picker arriba se hace
 * scrollable internamente si excede su contenedor.
 */

import type { ReactNode } from "react";
import styles from "./BottomActionBar.module.css";

export interface BottomActionBarProps {
  children: ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
