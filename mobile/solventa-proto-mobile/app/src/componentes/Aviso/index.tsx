import type { ReactNode } from 'react';
import styles from './estilos.module.css';

type Tono = 'info' | 'advertencia' | 'error' | 'exito';

interface AvisoProps {
  tono?: Tono;
  /** Ya traducido. */
  titulo?: string;
  children: ReactNode;
  /** Normalmente un Boton. */
  accion?: ReactNode;
  icono?: boolean;
}

function IconoInfo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <line
        x1="12"
        y1="11"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconoAdvertencia() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5 21.5 20h-19L12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="9.5"
        x2="12"
        y2="14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconoError() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <line
        x1="9"
        y1="9"
        x2="15"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="9"
        x2="9"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoExito() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12.5 11 15.5 16 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONOS: Record<Tono, () => ReactNode> = {
  info: IconoInfo,
  advertencia: IconoAdvertencia,
  error: IconoError,
  exito: IconoExito,
};

/**
 * Banner de mensaje contextual (lo usan Inicio, Billetera y Consentimiento).
 * El tono nunca se comunica solo por color: el icono es decorativo
 * (aria-hidden) y el texto siempre alcanza por si solo para entender el
 * mensaje.
 */
export default function Aviso({
  tono = 'info',
  titulo,
  children,
  accion,
  icono = true,
}: AvisoProps) {
  const Icono = ICONOS[tono];
  const clases = [styles.aviso, styles[tono]].filter(Boolean).join(' ');

  return (
    <div className={clases} role={tono === 'error' ? 'alert' : 'status'}>
      {icono && (
        <span className={styles.icono} aria-hidden="true">
          <Icono />
        </span>
      )}
      <div className={styles.contenido}>
        {titulo && <p className={styles.tituloAviso}>{titulo}</p>}
        <div className={styles.texto}>{children}</div>
        {accion && <div className={styles.accionAviso}>{accion}</div>}
      </div>
    </div>
  );
}
