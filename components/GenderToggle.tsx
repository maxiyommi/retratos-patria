"use client";

/*
 * GenderToggle — pill bipartito Dama/Caballero.
 *
 * Vive en el chrome celeste. Determina, junto con el personaje elegido en
 * CharacterPicker, qué retrato genera Gemini ("Dama porteña" vs "Caballero
 * porteño", "Dama soldada" vs "Caballero soldado", etc.).
 *
 * La pastilla blanca se desliza entre las dos opciones; el texto activo
 * pasa a celeste-tinta para contraste.
 */

import styles from "./GenderToggle.module.css";

export type Gender = "dama" | "caballero";

export interface GenderToggleProps {
  value: Gender;
  onChange: (g: Gender) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div
      className={styles.toggle}
      role="radiogroup"
      aria-label="Quiero ser representad@ como"
    >
      <span className={styles.knob} aria-hidden data-position={value} />
      <button
        type="button"
        role="radio"
        aria-checked={value === "dama"}
        data-active={value === "dama"}
        className={styles.option}
        onClick={() => onChange("dama")}
      >
        Dama
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "caballero"}
        data-active={value === "caballero"}
        className={styles.option}
        onClick={() => onChange("caballero")}
      >
        Caballero
      </button>
    </div>
  );
}
