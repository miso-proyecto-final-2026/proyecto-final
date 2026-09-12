import { useState, type ChangeEvent, type HTMLInputTypeAttribute } from 'react';
import Boton from '../Boton';
import styles from './estilos.module.css';

type TipoCampo = 'texto' | 'email' | 'contrasena' | 'tel' | 'numero' | 'fecha';
type ModoEntrada =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search';

interface CampoProps {
  id: string;
  /** Texto ya traducido: este componente NO usa useTextos. */
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: TipoCampo;
  /** Texto ya traducido, o null si no hay error. */
  error?: string | null;
  /** Texto ya traducido, o null si no hay ayuda. */
  ayuda?: string | null;
  requerido?: boolean;
  marcador?: string;
  autoComplete?: string;
  inputMode?: ModoEntrada;
  maxLength?: number;
  deshabilitado?: boolean;
  /** Solo para tipo 'contrasena': etiqueta accesible del boton de alternar. */
  etiquetaMostrar?: string;
  etiquetaOcultar?: string;
}

/** Icono de ojo (abierto/cerrado) en SVG inline: sin libreria de iconos. */
function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {tachado && (
        <line
          x1="2"
          y1="22"
          x2="22"
          y2="2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/**
 * Campo de formulario base del prototipo.
 *
 * No usa useTextos: etiqueta/error/ayuda llegan ya traducidos desde la
 * pantalla, para que sea reutilizable sin acoplarse al idioma activo.
 */
export default function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  tipo = 'texto',
  error = null,
  ayuda = null,
  requerido = false,
  marcador,
  autoComplete,
  inputMode,
  maxLength,
  deshabilitado = false,
  etiquetaMostrar,
  etiquetaOcultar,
}: CampoProps) {
  const [contrasenaVisible, setContrasenaVisible] = useState(false);

  const esContrasena = tipo === 'contrasena';
  const esNumero = tipo === 'numero';

  // 'numero' se implementa como texto + inputMode numeric: evita las flechas
  // y el scroll accidental del input numerico nativo. 'fecha' delega en el
  // selector de fecha nativo del sistema operativo.
  const tipoNativo: HTMLInputTypeAttribute = esContrasena
    ? contrasenaVisible
      ? 'text'
      : 'password'
    : esNumero
      ? 'text'
      : tipo === 'fecha'
        ? 'date'
        : tipo;
  const modoEntrada = esNumero ? (inputMode ?? 'numeric') : inputMode;

  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedBy =
    [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') ||
    undefined;

  const clasesInput = [styles.input, error ? styles.inputConError : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.contenedor}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
        {/* La senal de "requerido" combina simbolo + estilo del propio input
         * (ver .inputRequerido en el CSS): nunca solo el asterisco. */}
        {requerido && (
          <span className={styles.marcaRequerido} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <div
        className={
          esContrasena ? styles.envoltorioContrasena : styles.envoltorio
        }
      >
        <input
          id={id}
          type={tipoNativo}
          value={valor}
          onChange={(evento: ChangeEvent<HTMLInputElement>) =>
            onChange(evento.target.value)
          }
          placeholder={marcador}
          autoComplete={autoComplete}
          inputMode={modoEntrada}
          maxLength={maxLength}
          disabled={deshabilitado}
          required={requerido}
          aria-required={requerido || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            clasesInput,
            requerido ? styles.inputRequerido : '',
            esContrasena ? styles.inputConBoton : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {esContrasena && (
          <span className={styles.contenedorBotonOjo}>
            <Boton
              type="button"
              variante="texto"
              tamano="compacto"
              deshabilitado={deshabilitado}
              etiquetaAccesible={
                contrasenaVisible ? etiquetaOcultar : etiquetaMostrar
              }
              ariaPressed={contrasenaVisible}
              onClick={() => setContrasenaVisible((visible) => !visible)}
            >
              <IconoOjo tachado={!contrasenaVisible} />
            </Boton>
          </span>
        )}
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
