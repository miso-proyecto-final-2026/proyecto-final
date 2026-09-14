import styles from './estilos.module.css';

interface InterruptorProps {
  id: string;
  /** Ya traducida. */
  etiqueta: string;
  /** Ya traducida, opcional. */
  descripcion?: string;
  activo: boolean;
  onChange: (activo: boolean) => void;
  deshabilitado?: boolean;
}

/** Decorativo: refuerza el estado activo sin depender solo del color. */
function IconoCheck() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Interruptor on/off. Siempre <button role="switch">, nunca un checkbox
 * estilizado. No usa useTextos: etiqueta/descripcion llegan ya traducidas
 * desde la pantalla, igual que Campo y Selector.
 */
export default function Interruptor({
  id,
  etiqueta,
  descripcion,
  activo,
  onChange,
  deshabilitado = false,
}: InterruptorProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={activo}
      disabled={deshabilitado}
      className={styles.interruptor}
      onClick={() => onChange(!activo)}
    >
      <span className={styles.texto}>
        <span className={styles.etiqueta}>{etiqueta}</span>
        {descripcion && <span className={styles.descripcion}>{descripcion}</span>}
      </span>

      <span className={styles.control}>
        <span
          className={[styles.pista, activo ? styles.pistaActiva : '']
            .filter(Boolean)
            .join(' ')}
        >
          <span className={styles.perilla} />
        </span>
        {/* Refuerzo no-color del estado activo. La posicion de la perilla
         * (izquierda/derecha) ya es, en si misma, una senal independiente
         * del color para distinguir ambos estados. */}
        <span className={styles.iconoEstado} aria-hidden="true">
          {activo && <IconoCheck />}
        </span>
      </span>
    </button>
  );
}
