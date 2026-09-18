import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import styles from './estilos.module.css';

interface HojaModalProps {
  abierta: boolean;
  onCerrar: () => void;
  /** Ya traducido: este componente NO usa useTextos. */
  titulo: string;
  children: ReactNode;
  /** Normalmente Botones; se apilan a todo el ancho al pie de la hoja. */
  acciones?: ReactNode;
  /** Si es false, tocar el fondo oscuro no cierra la hoja. */
  cerrableTocandoFuera?: boolean;
}

const SELECTOR_ENFOCABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Hoja inferior modal (bottom sheet). Reutilizable: la usan la
 * reconfirmacion de consentimiento al cotizar y, mas adelante, la
 * biometria.
 *
 * Accesibilidad: role="dialog" + aria-modal, el foco entra al titulo al
 * abrir y vuelve al elemento que la abrio al cerrar, el foco queda
 * atrapado adentro (Tab / Shift+Tab) y Escape la cierra. La animacion de
 * entrada se desactiva con prefers-reduced-motion (ver el CSS).
 */
export default function HojaModal({
  abierta,
  onCerrar,
  titulo,
  children,
  acciones,
  cerrableTocandoFuera = true,
}: HojaModalProps) {
  const idTitulo = useId();
  const hojaRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  // onCerrar cambia de identidad en cada render del padre. Guardarlo en un
  // ref evita que los efectos de abajo se vuelvan a ejecutar (y le roben el
  // foco al usuario) cada vez que el padre se renderiza.
  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  // Foco: entra al titulo al abrir, vuelve a quien la abrio al cerrar.
  useEffect(() => {
    if (!abierta) return;
    const quienAbrio = document.activeElement as HTMLElement | null;
    tituloRef.current?.focus();

    return () => {
      // Si el elemento que la abrio ya no existe (p.ej. la pantalla se
      // reemplazo por un indicador de carga), no hay a donde devolver el foco.
      if (quienAbrio?.isConnected) quienAbrio.focus();
    };
  }, [abierta]);

  // Teclado a nivel de documento, no solo de la hoja: si el foco cae fuera
  // (p.ej. se toco el fondo con cerrableTocandoFuera=false), Escape y Tab
  // siguen funcionando.
  useEffect(() => {
    if (!abierta) return;

    function alTeclear(evento: KeyboardEvent) {
      const hoja = hojaRef.current;
      if (!hoja) return;

      if (evento.key === 'Escape') {
        evento.stopPropagation();
        onCerrarRef.current();
        return;
      }
      if (evento.key !== 'Tab') return;

      const enfocables = Array.from(hoja.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES));
      if (enfocables.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;

      // El titulo tiene tabIndex -1: no esta en la lista, pero es donde
      // arranca el foco. Desde ahi, Shift+Tab debe saltar al ultimo.
      if (!hoja.contains(activo)) {
        evento.preventDefault();
        primero.focus();
      } else if (evento.shiftKey && (activo === primero || activo === tituloRef.current)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierta]);

  if (!abierta) return null;

  function alTocarFondo(evento: MouseEvent<HTMLDivElement>) {
    if (cerrableTocandoFuera && evento.target === evento.currentTarget) {
      onCerrar();
    }
  }

  return (
    <div className={styles.fondo} onClick={alTocarFondo}>
      <div
        ref={hojaRef}
        className={styles.hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className={styles.titulo}>
          {titulo}
        </h2>
        <div className={styles.cuerpo}>{children}</div>
        {acciones && <div className={styles.acciones}>{acciones}</div>}
      </div>
    </div>
  );
}
