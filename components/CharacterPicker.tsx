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
      return <TricornioIcon />;
    case "vendedor":
      return <CanastoIcon />;
    case "soldado":
      return <MorrionIcon />;
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

function TricornioIcon() {
  // Tricornio con escarapela celeste/blanca al frente.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        fill="currentColor"
        d="M 8 42 L 22 16 L 32 20 L 42 16 L 56 42 Q 56 50 48 50 L 16 50 Q 8 50 8 42 Z"
      />
      {/* Escarapela celeste/blanca en la copa central */}
      <circle cx="32" cy="32" r="4.5" fill="#5b9ece" />
      <circle cx="32" cy="32" r="2.3" fill="#fbf7ec" />
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
  // Morrión con escarapela celeste/blanca prominente al frente.
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Cuerpo del morrión */}
      <path
        fill="currentColor"
        d="M 24 10 L 22 44 Q 22 48 26 48 L 38 48 Q 42 48 42 44 L 40 10 Z"
      />
      {/* Visera */}
      <path
        fill="currentColor"
        d="M 16 48 L 48 48 L 44 56 L 20 56 Z"
      />
      {/* Escarapela celeste/blanca grande al frente */}
      <circle cx="32" cy="26" r="5.5" fill="#5b9ece" />
      <circle cx="32" cy="26" r="2.8" fill="#fbf7ec" />
      <circle cx="32" cy="26" r="1.2" fill="#5b9ece" />
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
