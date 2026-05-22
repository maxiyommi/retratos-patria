/*
 * Footer — firma de autoría + link al repo.
 *
 * Es un proyecto personal de código abierto, no producto de una empresa.
 * La firma deliberadamente NO nombra al autor en el texto visible — el
 * link al repo de GitHub alcanza para que quien quiera identificar al
 * autor lo encuentre. Razón: control de privacidad / no exponer datos
 * personales innecesariamente desde la app.
 */

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.root}>
      <p className={styles.line}>
        Proyecto educativo de código abierto.
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
