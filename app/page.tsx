"use client";

import styles from "./page.module.css";
import { SolDeMayo } from "@/components/SolDeMayo";
import { PortraitFrame } from "@/components/PortraitFrame";

export default function Home() {
  const handleDownload = () => {
    // Stub: la implementación real llega en bloque 6.
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

      <section className={styles.preview} aria-labelledby="preview-cabildo">
        <header className={styles.previewHeader}>
          <h2 id="preview-cabildo" className={styles.previewTitle}>
            Variante <em>Cabildo</em>
          </h2>
          <p className={styles.previewNote}>Austera, despacho colonial.</p>
        </header>
        <PortraitFrame
          imageDataUrl="/sample-portrait.svg"
          characterName="Dama porteña"
          variant="cabildo"
          onDownload={handleDownload}
          onShare={handleShare}
        />
      </section>

      <section className={styles.preview} aria-labelledby="preview-recoleta">
        <header className={styles.previewHeader}>
          <h2 id="preview-recoleta" className={styles.previewTitle}>
            Variante <em>Recoleta</em>
          </h2>
          <p className={styles.previewNote}>
            Ornamentada, palmetas y badge 1810.
          </p>
        </header>
        <PortraitFrame
          imageDataUrl="/sample-portrait.svg"
          characterName="Caballero patriota"
          variant="recoleta"
          onDownload={handleDownload}
          onShare={handleShare}
        />
      </section>
    </main>
  );
}
