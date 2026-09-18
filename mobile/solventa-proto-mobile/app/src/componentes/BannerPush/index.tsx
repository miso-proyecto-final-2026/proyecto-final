import { useEffect, useRef } from 'react';
import Boton from '../Boton';
import styles from './estilos.module.css';

interface BannerPushProps {
  visible: boolean;
  /** Ya traducido: este componente NO usa useTextos. */
  titulo: string;
  /** Ya traducido. */
  cuerpo: string;
  /** Se pulso el cuerpo de la notificacion. */
  onPulsar: () => void;
  /** Se pidio cerrar, o se cumplio duracionMs. */
  onCerrar: () => void;
  /** Ya traducida: nombre accesible del boton de cierre (solo lleva icono). */
  etiquetaCerrar: string;
  duracionMs?: number;
}

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Notificacion superpuesta con aspecto de push del sistema (la usan H22 y,
 * mas adelante, H30). Se ancla arriba dentro del MarcoMovil.
 *
 * Accesibilidad: el contenedor es una region viva (role="status" +
 * aria-live="polite"). Sin eso, para un lector de pantalla la notificacion
 * simplemente no ocurre. Se autocierra tras duracionMs, salvo que el usuario
 * interactue (puntero o foco encima): entonces se queda hasta que la cierre
 * o la pulse.
 */
export default function BannerPush({
  visible,
  titulo,
  cuerpo,
  onPulsar,
  onCerrar,
  etiquetaCerrar,
  duracionMs = 6000,
}: BannerPushProps) {
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // onCerrar cambia de identidad en cada render del padre; en un ref para
  // que el temporizador no se reinicie por eso.
  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  function cancelarAutocierre() {
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  }

  // Arranca al mostrarse (o al cambiar el contenido: una notificacion nueva
  // reinicia la cuenta) y se limpia al ocultarse y al desmontar.
  useEffect(() => {
    if (!visible) return;
    temporizadorRef.current = setTimeout(() => onCerrarRef.current(), duracionMs);
    return cancelarAutocierre;
  }, [visible, duracionMs, titulo, cuerpo]);

  if (!visible) return null;

  return (
    <div
      className={styles.contenedor}
      role="status"
      aria-live="polite"
      onPointerDown={cancelarAutocierre}
      onPointerEnter={cancelarAutocierre}
      onFocus={cancelarAutocierre}
    >
      <div className={styles.banner}>
        <button type="button" className={styles.cuerpo} onClick={onPulsar}>
          <span className={styles.punto} aria-hidden="true" />
          <span className={styles.textos}>
            <span className={styles.titulo}>{titulo}</span>
            <span className={styles.detalle}>{cuerpo}</span>
          </span>
        </button>
        <Boton variante="texto" tamano="compacto" etiquetaAccesible={etiquetaCerrar} onClick={onCerrar}>
          <IconoCerrar />
        </Boton>
      </div>
    </div>
  );
}
