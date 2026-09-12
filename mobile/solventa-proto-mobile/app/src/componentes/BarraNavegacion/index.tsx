import { NavLink } from 'react-router';
import { useEstado } from '../../estado/StoreProvider';
import { notificacionesNoLeidas } from '../../estado/selectores';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

function IconoInicio({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoBilletera({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect
        x="3"
        y="6"
        width="18"
        height="13"
        rx="2.5"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="14"
        y1="12.5"
        x2="19"
        y2="12.5"
        stroke={activo ? 'var(--color-superficie)' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoNotificaciones({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5c-2.8 0-5 2.2-5 5v3.3c0 .6-.2 1.1-.6 1.6L5 15.5h14l-1.4-2.1c-.4-.5-.6-1-.6-1.6V8.5c0-2.8-2.2-5-5-5Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoAjustes({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="3"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1 5.6 5.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DESTINOS = [
  { ruta: '/inicio', clave: 'inicio' as const, Icono: IconoInicio },
  { ruta: '/billetera', clave: 'billetera' as const, Icono: IconoBilletera },
  {
    ruta: '/notificaciones',
    clave: 'notificaciones' as const,
    Icono: IconoNotificaciones,
  },
  { ruta: '/ajustes', clave: 'ajustes' as const, Icono: IconoAjustes },
];

/**
 * Barra inferior fija de navegacion, cuatro destinos. Solo tiene sentido
 * con sesion iniciada; en pantallas pre-login no debe verse.
 */
export default function BarraNavegacion() {
  const estado = useEstado();
  const { t } = useTextos();

  if (!estado.usuario.sesionIniciada) return null;

  const sinLeer = notificacionesNoLeidas(estado).length;

  return (
    <nav className={styles.barra} aria-label={t('navegacion.etiqueta')}>
      {DESTINOS.map(({ ruta, clave, Icono }) => (
        <NavLink
          key={ruta}
          to={ruta}
          className={({ isActive }) =>
            [styles.destino, isActive ? styles.activo : ''].filter(Boolean).join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span className={styles.iconoDestino}>
                <Icono activo={isActive} />
                {clave === 'notificaciones' && sinLeer > 0 && (
                  <span className={styles.insignia}>{sinLeer}</span>
                )}
              </span>
              <span className={styles.etiquetaDestino}>{t(`navegacion.${clave}`)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
