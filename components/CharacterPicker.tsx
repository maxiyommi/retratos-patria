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
  // Shako/morrión alto del Regimiento de Patricios (uniforme de gala
  // tipo Guardia Histórica): cilindro negro derecho con COPA SUPERIOR
  // ROJA, banda negra al pie, ala mínima, y una PLUMA/PENACHO BLANCO
  // alto y vertical al frente, casi tan alto como el shako. Sin
  // escarapela frontal — la silueta de identidad es la copa roja +
  // pluma blanca.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Pluma blanca alta y vertical al frente, casi del alto del shako. */}
      <path
        fill="#fbf7ec"
        d="M 33 4 Q 30 12 31 22 Q 31 28 33 31 Q 35 28 35 22 Q 36 12 33 4 Z"
      />
      <g stroke="#d9c98f" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M 33 8 L 30 11" />
        <path d="M 33 13 L 30 16" />
        <path d="M 33 18 L 30 21" />
        <path d="M 33 23 L 31 26" />
        <path d="M 33 8 L 36 11" />
        <path d="M 33 13 L 36 16" />
        <path d="M 33 18 L 36 21" />
        <path d="M 33 23 L 35 26" />
      </g>

      {/* Cuerpo del shako — cilindro vertical derecho, casi sin curvatura. */}
      <rect x="22" y="20" width="20" height="26" fill="currentColor" rx="1.5" />

      {/* Copa superior ROJA — el rasgo de identidad. */}
      <path
        fill="#c8412c"
        d="M 22 22 Q 22 19 25 19 L 39 19 Q 42 19 42 22 L 42 24 L 22 24 Z"
      />
      {/* Borde fino oscuro entre la copa roja y el cilindro negro. */}
      <rect x="22" y="24" width="20" height="1" fill="#1f1108" opacity="0.55" />

      {/* Banda negra de remate al pie del shako. */}
      <rect x="22" y="42" width="20" height="4" fill="#1f1108" opacity="0.75" />

      {/* Ala mínima abajo del shako — apenas un reborde para apoyar la cabeza. */}
      <ellipse cx="32" cy="47" rx="13" ry="2" fill="currentColor" />

      {/* Barbiquejo dorado cayendo del costado del shako (detalle militar). */}
      <path
        stroke="#e7ce8e"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        d="M 24 28 Q 22 36 26 44"
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
