import type { ReactNode } from 'react';
import styles from './estilos.module.css';

/**
 * Contenedor de nivel superior del prototipo.
 *
 * En un movil real ocupa toda la pantalla. En un escritorio se ve como un
 * telefono flotando sobre un fondo mas oscuro, para que quede claro que es
 * una simulacion. El marco en si no scrollea: quien scrollea es el
 * contenido, dentro de <main>.
 */
export default function MarcoMovil({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.fondoExterior}>
      <div className={styles.marco}>
        <main className={styles.contenido}>{children}</main>
      </div>
    </div>
  );
}
