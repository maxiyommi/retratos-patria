"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { SolDeMayo } from "@/components/SolDeMayo";
import { PortraitFrame } from "@/components/PortraitFrame";
import {
  CharacterPicker,
  type Character,
  type CharacterId,
} from "@/components/CharacterPicker";

// Datos temporales — pasan a lib/characters.ts en el bloque 5 junto con los
// prompts de Gemini.
const CHARACTERS: Character[] = [
  {
    id: "dama",
    nombre: "Dama porteña",
    descripcionCorta: "vestido bordado, peinetón, mantilla de encaje",
  },
  {
    id: "caballero",
    nombre: "Caballero patriota",
    descripcionCorta: "chaqueta militar azul, charreteras, casaca",
  },
  {
    id: "vendedor",
    nombre: "Vendedor ambulante",
    descripcionCorta: "poncho, sombrero de paja, canasto al hombro",
  },
  {
    id: "soldado",
    nombre: "Soldado de la Patria",
    descripcionCorta: "morrión con escarapela, fusil, casaca blanca",
  },
];

export default function Home() {
  const [selectedId, setSelectedId] = useState<CharacterId | null>(null);

  const handleDownload = () => {
    alert("Descarga (simulada): el retrato se guardaría en tu galería.");
  };
  const handleShare = () => {
    alert("Compartir (simulado): se abriría el panel nativo de compartir.");
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <SolDeMayo className={styles.sun} aria-hidden />
        <h1 className={styles.title}>Retratos de la Patria</h1>
        <div className={styles.divider} aria-hidden>
          <span className={styles.dividerLine} />
          <span className={styles.dividerDot} />
          <span className={styles.dividerLine} />
        </div>
        <p className={styles.tagline}>
          Sacate una foto y pintate como una figura de la Buenos Aires
          colonial de <em>1810</em>.
        </p>
      </section>

      <section className={styles.preview} aria-labelledby="preview-picker">
        <header className={styles.previewHeader}>
          <h2 id="preview-picker" className={styles.previewTitle}>
            Elegí un <em>personaje</em>
          </h2>
          <p className={styles.previewNote}>
            Tocá una tarjeta para previsualizar la selección.
          </p>
        </header>
        <CharacterPicker
          characters={CHARACTERS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </section>

      <section className={styles.preview} aria-labelledby="preview-frame">
        <header className={styles.previewHeader}>
          <h2 id="preview-frame" className={styles.previewTitle}>
            Tu <em>retrato</em>
          </h2>
          <p className={styles.previewNote}>
            (Placeholder sepia hasta que conectemos Gemini.)
          </p>
        </header>
        <PortraitFrame
          imageDataUrl="/sample-portrait.svg"
          characterName={
            selectedId
              ? CHARACTERS.find((c) => c.id === selectedId)!.nombre
              : "Sin elegir"
          }
          variant="cabildo"
          onDownload={handleDownload}
          onShare={handleShare}
        />
      </section>
    </main>
  );
}
