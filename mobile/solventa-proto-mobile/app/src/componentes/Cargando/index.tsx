import styles from './estilos.module.css';

interface CargandoProps {
  /** Ya traducido. */
  mensaje: string;
  /** Ya traducido, opcional. */
  submensaje?: string;
}

/**
 * Indicador de proceso en curso, a pantalla completa dentro del marco.
 * role="status" + aria-live="polite" para que un lector de pantalla
 * anuncie el mensaje apenas aparece.
 */
export default function Cargando({ mensaje, submensaje }: CargandoProps) {
  return (
    <div className={styles.contenedor} role="status" aria-live="polite">
      <span className={styles.espiral} aria-hidden="true" />
      <p className={styles.mensaje}>{mensaje}</p>
      {submensaje && <p className={styles.submensaje}>{submensaje}</p>}
    </div>
  );
}
