"use client";

/*
 * CharacterPicker — grilla de 4 personajes elegibles.
 *
 * Estética: "naipes patrios" / láminas de un manual histórico. Cada tarjeta
 * es un botón táctil con un iconograma único (no thumbnails genéricos). El
 * iconograma vive en una ventanita pergamino circular — el único guiño al
 * "mundo 1810" en el chrome celeste. El resto de la card es chrome moderno.
 *
 * Iconogramas elegidos por máxima distintividad:
 *   - Dama:      peinetón (peineta alta y abierta, símbolo inconfundible
 *                de la moda porteña ~1810-30).
 *   - Caballero: tricornio + jabot (sombrero patriota con chorrera de
 *                encaje, lo separa visualmente del soldado).
 *   - Vendedor:  canasto con productos (pan, yerba) sobre asa.
 *   - Soldado:   morrión con escarapela celeste/blanca + fusiles cruzados.
 *
 * Estados: idle / selected / dim. Cuando una está seleccionada, las otras
 * tres se atenúan (opacity 0.45, scale 0.98) para reforzar la elección.
 */

import { SolDeMayo } from "@/components/SolDeMayo";
import styles from "./CharacterPicker.module.css";

export type CharacterId = "dama" | "caballero" | "vendedor" | "soldado";

export interface Character {
  id: CharacterId;
  nombre: string;
  descripcionCorta: string;
}

export interface CharacterPickerProps {
  characters: Character[];
  selectedId: CharacterId | null;
  onSelect: (id: CharacterId) => void;
}

export function CharacterPicker({
  characters,
  selectedId,
  onSelect,
}: CharacterPickerProps) {
  return (
    <div
      className={styles.grid}
      role="radiogroup"
      aria-label="Elegí tu personaje de 1810"
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
            onClick={() => onSelect(c.id)}
          >
            <span className={styles.iconWindow} aria-hidden>
              <CharacterIcon id={c.id} />
            </span>

            <span className={styles.label}>
              <span className={styles.name}>{c.nombre}</span>
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

/* ── Iconogramas (SVGs inline, currentColor + acentos dorado/celeste) ── */

function CharacterIcon({ id }: { id: CharacterId }) {
  switch (id) {
    case "dama":
      return <PeinetonIcon />;
    case "caballero":
      return <TricornioIcon />;
    case "vendedor":
      return <CanastoIcon />;
    case "soldado":
      return <MorrionIcon />;
  }
}

function PeinetonIcon() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      {/* Peineta porteña: abanico rígido con filigrana */}
      <g fill="currentColor">
        {/* dientes inferiores */}
        <path d="M 22 64 L 23.5 74 L 25 64 Z" />
        <path d="M 28 64 L 29.5 74 L 31 64 Z" />
        <path d="M 34 64 L 35.5 74 L 37 64 Z" />
        <path d="M 40 64 L 41.5 74 L 43 64 Z" />
        <path d="M 46 64 L 47.5 74 L 49 64 Z" />
        <path d="M 52 64 L 53.5 74 L 55 64 Z" />
        {/* barra base */}
        <rect x="20" y="58" width="40" height="6" rx="1" />
        {/* abanico */}
        <path d="M 20 58 Q 14 38 22 18 Q 30 6 40 4 Q 50 6 58 18 Q 66 38 60 58 Z" />
      </g>
      {/* filigrana interior — claros y oscuros para textura */}
      <g>
        <ellipse cx="40" cy="36" rx="10" ry="14" fill="rgba(231,206,142,0.5)" />
        <ellipse cx="40" cy="36" rx="4" ry="7" fill="rgba(58,38,24,0.25)" />
        <path d="M 28 28 Q 40 22 52 28" stroke="rgba(231,206,142,0.4)" strokeWidth="1.2" fill="none" />
        <path d="M 28 46 Q 40 50 52 46" stroke="rgba(231,206,142,0.4)" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

function TricornioIcon() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <g>
        {/* Tricornio de frente: tres puntas */}
        <path
          d="M 10 42 L 24 16 L 40 22 L 56 16 L 70 42 Q 70 50 60 50 L 20 50 Q 10 50 10 42 Z"
          fill="currentColor"
        />
        {/* Escarapela en la copa izquierda */}
        <circle cx="22" cy="30" r="4" fill="var(--color-celeste)" />
        <circle cx="22" cy="30" r="2" fill="var(--color-blanco-calido)" />
        {/* Hilo dorado bordeando el ala */}
        <path
          d="M 11 42 L 24 18 L 40 24 L 56 18 L 69 42"
          stroke="var(--color-dorado)"
          strokeWidth="1"
          fill="none"
          opacity="0.85"
        />
        {/* Jabot — chorrera de encaje */}
        <path
          d="M 30 52 L 30 66 Q 32 72 36 72 L 40 76 L 44 72 Q 48 72 50 66 L 50 52 Z"
          fill="var(--color-blanco-calido)"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path d="M 32 58 L 48 58" stroke="currentColor" strokeWidth="0.7" />
        <path d="M 33 63 L 47 63" stroke="currentColor" strokeWidth="0.7" />
        <path d="M 35 68 L 45 68" stroke="currentColor" strokeWidth="0.7" />
      </g>
    </svg>
  );
}

function CanastoIcon() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <g>
        {/* Asa */}
        <path
          d="M 22 38 Q 40 14 58 38"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Cuerpo del canasto */}
        <path
          d="M 18 38 L 23 66 Q 23 70 27 70 L 53 70 Q 57 70 57 66 L 62 38 Z"
          fill="currentColor"
        />
        {/* Trama de mimbre */}
        <line x1="20" y1="46" x2="60" y2="46" stroke="rgba(231,206,142,0.55)" strokeWidth="0.9" />
        <line x1="20" y1="54" x2="60" y2="54" stroke="rgba(231,206,142,0.55)" strokeWidth="0.9" />
        <line x1="22" y1="62" x2="58" y2="62" stroke="rgba(231,206,142,0.55)" strokeWidth="0.9" />
        <line x1="30" y1="40" x2="30" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
        <line x1="40" y1="40" x2="40" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
        <line x1="50" y1="40" x2="50" y2="68" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
        {/* Productos asomando: panes y atado de yerba */}
        <ellipse cx="30" cy="36" rx="6" ry="3.5" fill="var(--color-dorado-suave)" stroke="var(--color-dorado)" strokeWidth="0.5" />
        <ellipse cx="42" cy="33" rx="5" ry="3" fill="var(--color-dorado-suave)" stroke="var(--color-dorado)" strokeWidth="0.5" />
        <rect x="48" y="30" width="6" height="9" fill="var(--color-dorado)" rx="0.5" transform="rotate(8 51 34.5)" />
      </g>
    </svg>
  );
}

function MorrionIcon() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className={styles.icon} aria-hidden>
      <g>
        {/* Pluma del morrión */}
        <path
          d="M 36 8 Q 40 4 44 8 L 44 18 L 36 18 Z"
          fill="var(--color-celeste-profundo)"
        />
        {/* Cuerpo del morrión */}
        <path
          d="M 26 18 L 23 50 Q 23 54 27 54 L 53 54 Q 57 54 57 50 L 54 18 Z"
          fill="currentColor"
        />
        {/* Visera */}
        <path d="M 20 50 L 60 50 L 56 58 L 24 58 Z" fill="currentColor" />
        {/* Barbiquejo dorado */}
        <path
          d="M 27 46 L 32 50 L 48 50 L 53 46"
          stroke="var(--color-dorado)"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Escarapela */}
        <circle cx="40" cy="32" r="6" fill="var(--color-celeste)" />
        <circle cx="40" cy="32" r="3.2" fill="var(--color-blanco-calido)" />
        <circle cx="40" cy="32" r="1.4" fill="var(--color-celeste-profundo)" />
        {/* Fusiles cruzados debajo */}
        <line x1="14" y1="76" x2="38" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="66" y1="76" x2="42" y2="58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="38" y1="58" x2="34.5" y2="54.5" stroke="var(--color-celeste-profundo)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="42" y1="58" x2="45.5" y2="54.5" stroke="var(--color-celeste-profundo)" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
