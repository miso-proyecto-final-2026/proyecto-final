import { useId, type ReactNode } from 'react';
import styles from './estilos.module.css';

interface TarjetaProps {
  /** Ya traducido. */
  titulo: string;
  /** Ya traducida. */
  descripcion: string;
  icono: ReactNode;
  onClick?: () => void;
  deshabilitada?: boolean;
  /** Ya traducido, o null. Solo se muestra si ademas deshabilitada es true. */
  motivoBloqueo?: string | null;
  /** Contador; si es 0 o no se pasa, no se renderiza. */
  insignia?: number;
}

/**
 * Tarjeta de accion del menu principal (Inicio). Siempre <button> nativo,
 * nunca un div con onClick.
 */
export default function Tarjeta({
  titulo,
  descripcion,
  icono,
  onClick,
  deshabilitada = false,
  motivoBloqueo = null,
  insignia,
}: TarjetaProps) {
  const idMotivo = useId();
  const mostrarMotivo = deshabilitada && !!motivoBloqueo;
  const mostrarInsignia = insignia != null && insignia > 0;

  return (
    <button
      type="button"
      className={styles.tarjeta}
      onClick={onClick}
      disabled={deshabilitada}
      aria-describedby={mostrarMotivo ? idMotivo : undefined}
    >
      <span className={styles.iconoContenedor} aria-hidden="true">
        {icono}
      </span>
      <span className={styles.contenido}>
        <span className={styles.titulo}>{titulo}</span>
        <span className={styles.descripcion}>{descripcion}</span>
        {mostrarMotivo && (
          <span id={idMotivo} className={styles.motivoBloqueo}>
            {motivoBloqueo}
          </span>
        )}
      </span>
      {mostrarInsignia && <span className={styles.insignia}>{insignia}</span>}
    </button>
  );
}
