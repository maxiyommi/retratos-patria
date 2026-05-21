"use client";

/*
 * CharacterPicker — grilla de 4 ROLES elegibles.
 *
 * Los roles son neutros respecto al género (Porteño/a, Patriota, Vendedor/a,
 * Soldado/a). El género (Dama o Caballero) lo elige aparte el GenderToggle.
 * La combinación role + género arma el nombre completo del personaje en la
 * cartela del PortraitFrame y el prompt de Gemini.
 *
 * Estética: "naipes patrios" / láminas de un manual histórico. Cada card
 * tiene un iconograma simple — una silueta limpia en un solo color, sin
 * filigrana ni acentos. Esto sigue al feedback "iconos más simples".
 *
 * Las cards viven en el chrome (blanco cálido / celeste). La ventanita
 * pergamino circular es el único guiño al mundo 1810.
 */

import { SolDeMayo } from "@/components/SolDeMayo";
import { haptic } from "@/lib/haptic";
import type { Character, CharacterId } from "@/lib/characters";
import styles from "./CharacterPicker.module.css";

// Re-exportamos los tipos para que los consumidores del componente puedan
// seguir importándolos de aquí si ya lo hacían.
export type { Character, CharacterId };

export interface CharacterPickerProps {
  characters: Character[];
  selectedId: CharacterId | null;
  onSelect: (id: CharacterId) => void;
  /** Etiqueta corta a mostrar en cada card (rol sin género). */
  labelFor: (c: Character) => string;
}

export function CharacterPicker({
  characters,
  selectedId,
  onSelect,
  labelFor,
}: CharacterPickerProps) {
  return (
    <div
      className={styles.grid}
      role="radiogroup"
      aria-label="Elegí tu rol de 1810"
    >
      {characters.map((c) => {
        const isSelected = selectedId === c.id;
        const state = !selectedId ? "idle" : isSelected ? "selected" : "dim";
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-state={state}
            className={styles.card}
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
              <span className={styles.description}>{c.descripcionCorta}</span>
            </span>

            {isSelected && (
              <span className={styles.stamp} aria-hidden>
                <SolDeMayo />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Iconogramas (siluetas simples, currentColor único) ────────────────
 *
 * Cada icono es una silueta limpia, sin colores secundarios ni detalle
 * interno. Heredan el color del contenedor (currentColor) que la card
 * pasa a celeste-tinta en idle y celeste-profundo en selected.
 */

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
      {/* Abanico del peinetón */}
      <path
        fill="currentColor"
        d="M 14 50 Q 14 26 22 12 Q 28 4 32 4 Q 36 4 42 12 Q 50 26 50 50 L 50 54 L 14 54 Z"
      />
      {/* Dientes inferiores */}
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
      {/* Asa */}
      <path
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        d="M 18 30 Q 32 10 46 30"
      />
      {/* Cuerpo */}
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
      {/* Cuerpo del morrión */}
      <path
        fill="currentColor"
        d="M 24 12 L 22 44 Q 22 48 26 48 L 38 48 Q 42 48 42 44 L 40 12 Z"
      />
      {/* Visera */}
      <path
        fill="currentColor"
        d="M 16 48 L 48 48 L 44 56 L 20 56 Z"
      />
    </svg>
  );
}
