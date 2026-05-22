"use client";

/*
 * CharacterPicker — lista vertical de roles seleccionables, estilo iOS
 * Settings row.
 *
 * Diseño: 4 filas siempre visibles, cada una con ícono circular pergamino
 * + nombre (Cormorant) + descripción corta (EB Garamond italic) + chevron
 * o check dorado. Patrón nativo de selección iOS / Material List —
 * preferido sobre dropdowns para sets pequeños (≤5 opciones) porque no
 * requiere tap extra y todas las opciones son escaneables al instante.
 *
 * El género (dama / caballero) lo controla aparte el GenderToggle del
 * header. El picker es agnóstico de género — sólo muestra los roles
 * neutros declinados por el labelFor que pasa el padre.
 */

import { haptic } from "@/lib/haptic";
import type { Character, CharacterId } from "@/lib/characters";
import styles from "./CharacterPicker.module.css";

export type { Character, CharacterId };

export interface CharacterPickerProps {
  characters: Character[];
  selectedId: CharacterId | null;
  onSelect: (id: CharacterId) => void;
  labelFor: (c: Character) => string;
}

export function CharacterPicker({
  characters,
  selectedId,
  onSelect,
  labelFor,
}: CharacterPickerProps) {
  return (
    <ul
      className={styles.list}
      role="radiogroup"
      aria-label="Elegí tu rol de 1810"
    >
      {characters.map((c) => {
        const isSelected = selectedId === c.id;
        const state = !selectedId ? "idle" : isSelected ? "selected" : "dim";
        return (
          <li key={c.id} className={styles.item}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-state={state}
              className={styles.row}
              onClick={() => {
                haptic("select");
                onSelect(c.id);
              }}
            >
              <span className={styles.iconWindow} aria-hidden>
                <CharacterIcon id={c.id} />
              </span>
              <span className={styles.label}>
                <span className={styles.name}>{labelFor(c)}</span>
                <span className={styles.description}>
                  {c.descripcionCorta}
                </span>
              </span>
              <span className={styles.indicator} aria-hidden>
                {isSelected ? <CheckIcon /> : <ChevronIcon />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Iconogramas (siluetas simples, currentColor) ─────────────────── */

function CharacterIcon({ id }: { id: CharacterId }) {
  switch (id) {
    case "porteno":
      return <PeinetonIcon />;
    case "patriota":
      return <EscarapelaIcon />;
    case "vendedor":
      return <CanastoIcon />;
    case "patricio":
      return <MorrionIcon />;
    case "gaucho":
      return <SombreroAludoIcon />;
    case "aguatero":
      return <BarrilIcon />;
  }
}

function PeinetonIcon() {
  // Peinetón con abanico calado (3 ribs en hueco) y dientes claros abajo.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        fill="currentColor"
        d="M 12 50 Q 12 24 22 10 Q 28 3 32 3 Q 36 3 42 10 Q 52 24 52 50 Z"
      />
      {/* Cutout ribs — strokes en color pergamino simulan calado */}
      <g stroke="#efe1bf" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 22 16 V 46" />
        <path d="M 32 10 V 46" />
        <path d="M 42 16 V 46" />
      </g>
      {/* Dientes del peine debajo */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 17 50 V 60" />
        <path d="M 23 50 V 62" />
        <path d="M 29 50 V 62" />
        <path d="M 35 50 V 62" />
        <path d="M 41 50 V 62" />
        <path d="M 47 50 V 60" />
      </g>
    </svg>
  );
}

function EscarapelaIcon() {
  // Escarapela argentina — cocarda celeste/blanca/celeste, símbolo directo
  // del Patriota de Mayo. Anillos concéntricos + dos cintas cayendo abajo.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Cintas/colas cayendo detrás del disco — sugieren la cocarda prendida */}
      <g fill="#5b9ece">
        <path d="M 22 36 L 18 58 L 26 54 L 28 38 Z" />
        <path d="M 42 36 L 46 58 L 38 54 L 36 38 Z" />
      </g>
      <g fill="#fbf7ec">
        <path d="M 26 38 L 22 58 L 26 56 L 28 40 Z" opacity="0.85" />
        <path d="M 38 38 L 42 58 L 38 56 L 36 40 Z" opacity="0.85" />
      </g>
      {/* Disco principal con anillos concéntricos */}
      <circle cx="32" cy="28" r="18" fill="#5b9ece" />
      <circle cx="32" cy="28" r="12" fill="#fbf7ec" />
      <circle cx="32" cy="28" r="6" fill="#5b9ece" />
      {/* Pliegue / botón central pequeño con currentColor para "anclar" al rol */}
      <circle cx="32" cy="28" r="2" fill="currentColor" />
    </svg>
  );
}

function CanastoIcon() {
  // Canasto de mimbre con pan/baguette asomando.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Pan asomando atrás */}
      <ellipse cx="24" cy="28" rx="7" ry="3.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="40" cy="26" rx="6" ry="3" fill="currentColor" opacity="0.55" />
      {/* Asa */}
      <path
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        d="M 18 30 Q 32 10 46 30"
      />
      {/* Cuerpo del canasto */}
      <path
        fill="currentColor"
        d="M 14 32 L 18 56 Q 18 60 22 60 L 42 60 Q 46 60 46 56 L 50 32 Z"
      />
      {/* Trama de mimbre (líneas color pergamino sobre el cuerpo) */}
      <g stroke="#efe1bf" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M 17 40 H 47" />
        <path d="M 18 48 H 46" />
        <path d="M 19 55 H 45" />
      </g>
    </svg>
  );
}

function MorrionIcon() {
  // Shako del Regimiento de Patricios: cilindro NEGRO LISO de arriba a
  // abajo (sin copa roja). La PLUMA blanca y la ESCARAPELA roja van al
  // COSTADO IZQUIERDO de la copa — no centradas al frente. Esa es la
  // silueta de identidad correcta del uniforme de gala.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Cuerpo del shako — cilindro vertical negro liso. */}
      <rect x="22" y="20" width="20" height="26" fill="currentColor" rx="1.5" />

      {/* Banda más oscura al pie del shako. */}
      <rect x="22" y="42" width="20" height="4" fill="#1f1108" opacity="0.75" />

      {/* Pluma blanca alta saliendo del COSTADO IZQUIERDO de la copa,
          ligeramente inclinada hacia afuera (no centrada al frente). */}
      <path
        fill="#fbf7ec"
        d="M 22 4 Q 18 12 19 22 Q 20 27 23 30 Q 25 26 25 21 Q 27 11 22 4 Z"
      />
      <g stroke="#d9c98f" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M 22 8 L 19 11" />
        <path d="M 22 13 L 19 16" />
        <path d="M 22 18 L 20 21" />
        <path d="M 22 8 L 25 11" />
        <path d="M 22 13 L 25 16" />
        <path d="M 22 18 L 24 21" />
      </g>

      {/* Escarapela roja al pie de la pluma, también al costado izquierdo. */}
      <circle cx="22" cy="29" r="3" fill="#c8412c" />
      <circle cx="22" cy="29" r="1.4" fill="#fbf7ec" />

      {/* Ala mínima abajo del shako. */}
      <ellipse cx="32" cy="47" rx="13" ry="2" fill="currentColor" />

      {/* Barbiquejo dorado cayendo del costado derecho (lado opuesto a la pluma). */}
      <path
        stroke="#e7ce8e"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        d="M 40 28 Q 42 36 38 44"
      />
    </svg>
  );
}

function SombreroAludoIcon() {
  // Sombrero gauchesco de ala ancha con barbijo bajo el mentón.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Ala ancha del sombrero */}
      <ellipse cx="32" cy="36" rx="26" ry="6" fill="currentColor" />
      {/* Copa baja */}
      <path
        fill="currentColor"
        d="M 20 36 Q 20 18 32 18 Q 44 18 44 36 Z"
      />
      {/* Cinta de la copa */}
      <rect x="20" y="32" width="24" height="3" fill="#efe1bf" opacity="0.85" />
      {/* Barbijo cayendo bajo el ala */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M 14 38 Q 18 52 28 58" />
        <path d="M 50 38 Q 46 52 36 58" />
      </g>
    </svg>
  );
}

function BarrilIcon() {
  // Barril de madera con aros metálicos — emblema del aguatero porteño.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Cuerpo del barril (forma abombada) */}
      <path
        fill="currentColor"
        d="M 18 12 L 46 12 Q 54 32 46 52 L 18 52 Q 10 32 18 12 Z"
      />
      {/* Duelas verticales sugeridas */}
      <g stroke="#efe1bf" strokeWidth="1.2" fill="none" opacity="0.55">
        <path d="M 26 14 Q 24 32 26 50" />
        <path d="M 32 13 V 51" />
        <path d="M 38 14 Q 40 32 38 50" />
      </g>
      {/* Aros metálicos: superior, medio y inferior */}
      <g stroke="#efe1bf" strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d="M 17 16 L 47 16" />
        <path d="M 13 32 L 51 32" />
        <path d="M 17 48 L 47 48" />
      </g>
      {/* Tapón / orificio de servicio arriba */}
      <circle cx="32" cy="16" r="2" fill="#efe1bf" opacity="0.85" />
    </svg>
  );
}

/* ── Indicadores de fila ──────────────────────────────────────────── */

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M 6 4 L 10 8 L 6 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M 4 10 L 8.5 14.5 L 16 6" />
    </svg>
  );
}
