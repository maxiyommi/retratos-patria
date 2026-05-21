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
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        fill="currentColor"
        d="M 14 50 Q 14 26 22 12 Q 28 4 32 4 Q 36 4 42 12 Q 50 26 50 50 L 50 54 L 14 54 Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        d="M 18 54 L 19 60 M 23 54 L 24 60 M 28 54 L 29 60 M 33 54 L 34 60 M 38 54 L 39 60 M 43 54 L 44 60 M 47 54 L 48 60"
      />
    </svg>
  );
}

function TricornioIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        fill="currentColor"
        d="M 8 38 L 22 14 L 32 18 L 42 14 L 56 38 Q 56 46 48 46 L 16 46 Q 8 46 8 38 Z"
      />
    </svg>
  );
}

function CanastoIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        d="M 18 30 Q 32 10 46 30"
      />
      <path
        fill="currentColor"
        d="M 14 32 L 18 56 Q 18 60 22 60 L 42 60 Q 46 60 46 56 L 50 32 Z"
      />
    </svg>
  );
}

function MorrionIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <path
        fill="currentColor"
        d="M 24 12 L 22 44 Q 22 48 26 48 L 38 48 Q 42 48 42 44 L 40 12 Z"
      />
      <path
        fill="currentColor"
        d="M 16 48 L 48 48 L 44 56 L 20 56 Z"
      />
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
