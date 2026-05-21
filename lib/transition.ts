/*
 * transition.ts — View Transitions API helper con dirección semántica.
 *
 * Cuando el browser soporta document.startViewTransition (Chrome 111+,
 * Edge, Safari 18+), envuelve un cambio de estado React para que la
 * transición visual entre el "antes" y el "después" use keyframes
 * personalizadas en globals.css. Si no se soporta, ejecuta el setter
 * directo (fallback graceful: la animación CSS del .step de AppFlow
 * sigue funcionando).
 *
 * `direction` mappea a un dataset en <html> que las @keyframes leen
 * para decidir si el slide es "siguiente" (avanzar a la derecha) o
 * "atrás" (volver a la izquierda). Mismo paradigma que iOS Navigation.
 */

import { flushSync } from "react-dom";

export type TransitionDirection = "forward" | "backward";

// El método startViewTransition todavía no está en los lib.dom.d.ts
// estables de TypeScript en algunos targets. Lo tipamos in-place sin
// extender el tipo global Document (que produce conflictos con la
// declaración built-in).
type StartViewTransitionFn = (callback: () => void) => {
  finished: Promise<void>;
};

export function transitionState(
  apply: () => void,
  direction: TransitionDirection = "forward",
): void {
  if (typeof document === "undefined") {
    apply();
    return;
  }
  const start = (document as unknown as { startViewTransition?: StartViewTransitionFn })
    .startViewTransition;
  if (typeof start !== "function") {
    apply();
    return;
  }
  // El dataset de <html> persiste durante la transición, las @keyframes
  // de globals.css lo consultan vía selector.
  document.documentElement.dataset.transitionDirection = direction;
  start.call(document, () => {
    // flushSync fuerza a React a renderizar de forma síncrona, así la
    // transition captura el "después" correcto. Sin esto, React batchea
    // y el view transition se ejecuta sobre el estado equivocado.
    flushSync(apply);
  });
}
