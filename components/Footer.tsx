/*
 * Footer — firma de autoría + links a LinkedIn y GitHub.
 *
 * Es un proyecto personal de Maximiliano Yommi: no debe presentarse como
 * producto de una empresa. La firma es directa y digna, sin pomposidad.
 */

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.root}>
      <p className={styles.line}>
        Proyecto de código abierto de{" "}
        <a
          className={styles.author}
          href="https://www.linkedin.com/in/maximilianoyommi/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Maximiliano Yommi
        </a>
        .
      </p>
      <p className={styles.line}>
        <a
          className={styles.muted}
          href="https://github.com/maxiyommi/retratos-patria"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver el código en GitHub
        </a>
      </p>
    </footer>
  );
}
