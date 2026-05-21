/*
 * Sol de Mayo esquemático — ornamento decorativo del chrome de la app.
 *
 * 16 rayos alternando recto/ondulado alrededor de un disco central. Hereda
 * el color desde la propiedad CSS `color` del contenedor (vía currentColor),
 * para que cada lugar de la app pueda teñirlo en su tono de dorado.
 *
 * El "real" Sol de Mayo con rostro queda para el marco del retrato; este es
 * la versión simplificada y plana para la UI.
 */

import type { SVGProps } from "react";

const STRAIGHT_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
const WAVY_RAYS = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

export function SolDeMayo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="currentColor">
        {STRAIGHT_RAYS.map((angle) => (
          <polygon
            key={`s-${angle}`}
            points="-6,-50 6,-50 0,-95"
            transform={`rotate(${angle})`}
          />
        ))}
        {WAVY_RAYS.map((angle) => (
          <path
            key={`w-${angle}`}
            d="M-4,-50 Q 0,-65 -3,-78 Q 0,-90 4,-50 Z"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="38" />
        <circle r="38" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      </g>
    </svg>
  );
}
