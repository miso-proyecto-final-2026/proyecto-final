import type { ChangeEvent } from 'react';
import styles from './estilos.module.css';

interface OpcionSelector {
  valor: string;
  /** Ya traducida. */
  etiqueta: string;
}

interface SelectorProps {
  id: string;
  /** Ya traducida: este componente NO usa useTextos. */
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  opciones: OpcionSelector[];
  marcador?: string;
  requerido?: boolean;
  /** Ya traducida, o null si no hay ayuda. */
  ayuda?: string | null;
  /** Ya traducido, o null si no hay error. */
  error?: string | null;
  deshabilitado?: boolean;
}

/** Flecha decorativa: el <select> nativo ya es accesible por si solo. */
function IconoFlecha() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 9l6 6 6-6"
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
 * Equivalente de Campo para listas desplegables.
 *
 * Siempre <select> nativo, nunca un menu propio: en movil el selector del
 * sistema operativo es mejor que cualquier alternativa a medida, y ya es
 * accesible por defecto. No usa useTextos: etiqueta/opciones/ayuda/error
 * llegan ya traducidos desde la pantalla.
 */
export default function Selector({
  id,
  etiqueta,
  valor,
  onChange,
  opciones,
  marcador,
  requerido = false,
  ayuda = null,
  error = null,
  deshabilitado = false,
}: SelectorProps) {
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedBy =
    [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={styles.contenedor}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
        {/* Misma senal doble de "requerido" que Campo: nunca solo el
         * asterisco (ver .selectRequerido en el CSS). */}
        {requerido && (
          <span className={styles.marcaRequerido} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <div className={styles.envoltorio}>
        <select
          id={id}
          value={valor}
          onChange={(evento: ChangeEvent<HTMLSelectElement>) =>
            onChange(evento.target.value)
          }
          disabled={deshabilitado}
          required={requerido}
          aria-required={requerido || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            styles.select,
            error ? styles.selectConError : '',
            requerido ? styles.selectRequerido : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <option value="" disabled hidden>
            {marcador}
          </option>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
        <span className={styles.flecha} aria-hidden="true">
          <IconoFlecha />
        </span>
      </div>

      {ayuda && (
        <p id={idAyuda} className={styles.ayuda}>
          {ayuda}
        </p>
      )}

      {error && (
        <p id={idError} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
