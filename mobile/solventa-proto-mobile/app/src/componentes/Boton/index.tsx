import type { MouseEventHandler, ReactNode } from 'react';
import styles from './estilos.module.css';

type Variante = 'primario' | 'secundario' | 'texto' | 'peligro';
type Tamano = 'normal' | 'compacto';

interface BotonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variante?: Variante;
  tamano?: Tamano;
  anchoCompleto?: boolean;
  deshabilitado?: boolean;
  cargando?: boolean;
  etiquetaAccesible?: string;
  type?: 'button' | 'submit';
  /** Solo para botones tipo toggle (p.ej. mostrar/ocultar contraseña en Campo). */
  ariaPressed?: boolean;
  /** Solo para botones que abren/cierran un bloque en linea (p.ej. "Ver términos"). */
  ariaExpanded?: boolean;
}

/** children es texto plano si es un string o un numero (p.ej. un contador). */
const esSoloTexto = (children: ReactNode) =>
  typeof children === 'string' || typeof children === 'number';

/**
 * Boton base del prototipo. Siempre un <button> nativo: nunca un div con
 * onClick. No usa useTextos a proposito: el texto llega por children, para
 * que sea reutilizable en cualquier pantalla.
 */
export default function Boton({
  children,
  onClick,
  variante = 'primario',
  tamano = 'normal',
  anchoCompleto = false,
  deshabilitado = false,
  cargando = false,
  etiquetaAccesible,
  type = 'button',
  ariaPressed,
  ariaExpanded,
}: BotonProps) {
  if (!esSoloTexto(children) && !etiquetaAccesible) {
    console.warn(
      '[Boton] Falta etiquetaAccesible: el contenido no es texto plano y el boton quedaria sin nombre accesible.'
    );
  }

  const clases = [
    styles.boton,
    styles[variante],
    styles[tamano],
    anchoCompleto ? styles.anchoCompleto : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={clases}
      onClick={onClick}
      disabled={deshabilitado || cargando}
      aria-busy={cargando || undefined}
      aria-label={etiquetaAccesible}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
    >
      {/* opacity, no visibility/display: el boton conserva su ancho durante
       * la carga y, si no hay etiquetaAccesible, el texto sigue siendo
       * anunciado por lectores de pantalla. */}
      <span className={cargando ? styles.contenidoOculto : undefined}>
        {children}
      </span>
      {cargando && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
