import styles from "./page.module.css";
import { SolDeMayo } from "@/components/SolDeMayo";

export default function Home() {
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

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Próximamente</h2>
        <p>
          Estamos preparando el bastidor. En unos días vas a poder elegir
          entre cuatro personajes y ver tu retrato pintado al óleo.
        </p>
      </section>
    </main>
  );
}
