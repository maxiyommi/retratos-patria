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
import { GenderToggle, type Gender } from "@/components/GenderToggle";
import { LoadingState } from "@/components/LoadingState";

// Modelo extendido: los roles son neutros respecto al género, pero cada uno
// tiene formas declinadas en femenino y masculino. La combinación de rol +
// género arma el nombre completo del personaje (cartela del retrato, prompt).
// Esto pasa formalmente a lib/characters.ts en el bloque 5.
const CHARACTERS: Character[] = [
  {
    id: "porteno",
    nombreDama: "Dama porteña",
    nombreCaballero: "Caballero porteño",
    descripcionCorta: "vestimenta de sociedad porteña",
  },
  {
    id: "patriota",
    nombreDama: "Dama patriota",
    nombreCaballero: "Caballero patriota",
    descripcionCorta: "casaca azul y tricornio de Mayo",
  },
  {
    id: "vendedor",
    nombreDama: "Vendedora ambulante",
    nombreCaballero: "Vendedor ambulante",
    descripcionCorta: "poncho, sombrero y canasto",
  },
  {
    id: "soldado",
    nombreDama: "Soldada de la Patria",
    nombreCaballero: "Soldado de la Patria",
    descripcionCorta: "morrión, escarapela y fusil",
  },
];

// Etiqueta corta para mostrar dentro de la card (declinada por género).
const SHORT_BY_ID: Record<CharacterId, { dama: string; caballero: string }> = {
  porteno: { dama: "Porteña", caballero: "Porteño" },
  patriota: { dama: "Patriota", caballero: "Patriota" },
  vendedor: { dama: "Vendedora", caballero: "Vendedor" },
  soldado: { dama: "Soldada", caballero: "Soldado" },
};

export default function Home() {
  const [gender, setGender] = useState<Gender>("dama");
  const [selectedId, setSelectedId] = useState<CharacterId | null>(null);

  const labelFor = (c: Character) => SHORT_BY_ID[c.id][gender];

  const selected = selectedId
    ? CHARACTERS.find((c) => c.id === selectedId)
    : null;
  const fullName = selected
    ? gender === "dama"
      ? selected.nombreDama
      : selected.nombreCaballero
    : "Sin elegir";

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

      <section className={styles.preview} aria-labelledby="preview-gender">
        <header className={styles.previewHeader}>
          <h2 id="preview-gender" className={styles.previewTitle}>
            Quiero ser <em>representad@</em> como
          </h2>
        </header>
        <GenderToggle value={gender} onChange={setGender} />
      </section>

      <section className={styles.preview} aria-labelledby="preview-picker">
        <header className={styles.previewHeader}>
          <h2 id="preview-picker" className={styles.previewTitle}>
            Elegí un <em>rol</em>
          </h2>
        </header>
        <CharacterPicker
          characters={CHARACTERS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          labelFor={labelFor}
        />
      </section>

      <section className={styles.preview} aria-labelledby="preview-loading">
        <header className={styles.previewHeader}>
          <h2 id="preview-loading" className={styles.previewTitle}>
            Mientras se <em>pinta</em>
          </h2>
          <p className={styles.previewNote}>
            (Estado de espera — refrescá la página para ver la formación
            del Sol desde el inicio.)
          </p>
        </header>
        <LoadingState characterName={fullName} />
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
          characterName={fullName}
          variant="cabildo"
          onDownload={handleDownload}
          onShare={handleShare}
        />
      </section>
    </main>
  );
}
