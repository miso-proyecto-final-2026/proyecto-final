import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Tarjeta from '../../componentes/Tarjeta';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { cerrarSesion } from '../../estado/acciones';
import {
  necesitaVerificacion,
  polizasSinFirmar,
  puedeCotizar,
  verificacionEnCurso,
  verificacionRechazada,
} from '../../estado/selectores';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

/** Iconos de las tarjetas: decorativos, especificos de esta pantalla. */
function IconoCotizar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoPolizas() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoConsentimiento() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M4 10h16M6 10V7.5L12 4l6 3.5V10M5 10v9M19 10v9M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoBiometria() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 2.2.4 3.8 1 5M12 3.5c4.7 0 8.5 3.8 8.5 8.5 0 1.2-.1 2.2-.3 3M8.5 20c1-1.5 1.5-3.5 1.5-6a2 2 0 0 1 4 0c0 1 0 2-.3 3M12 8a4 4 0 0 1 4 4c0 2.5-.5 4.5-1.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Menu principal (H-varias). Si no hay sesion iniciada, no aplica: se
 * redirige a la Bienvenida.
 */
export default function Inicio() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTextos();

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  const saludo = estado.usuario.nombre
    ? t('inicio.saludo', { nombre: estado.usuario.nombre })
    : t('inicio.saludoGenerico');

  // Los tres avisos de KYC son mutuamente excluyentes: rechazada > en curso
  // > pendiente (no iniciada). Si esta aprobado, ninguno se muestra.
  const rechazada = verificacionRechazada(estado);
  const enCurso = verificacionEnCurso(estado);
  const pendiente = necesitaVerificacion(estado) && !rechazada && !enCurso;

  function salir() {
    dispatch(cerrarSesion());
    navigate('/');
  }

  return (
    <div className={styles.pantalla}>
      <h1 className={styles.saludo}>{saludo}</h1>

      <div className={styles.avisos}>
        {estado.debug.sinConexion && (
          <Aviso tono="advertencia">{t('inicio.sinConexion')}</Aviso>
        )}

        {rechazada && (
          <Aviso
            tono="error"
            accion={
              <Boton tamano="compacto" onClick={() => navigate('/verificacion-identidad')}>
                {t('inicio.reintentarKyc')}
              </Boton>
            }
          >
            {t('inicio.kycRechazado')}
          </Aviso>
        )}
        {enCurso && <Aviso tono="info">{t('inicio.kycEnCurso')}</Aviso>}
        {pendiente && (
          <Aviso
            tono="advertencia"
            titulo={t('inicio.kycPendienteTitulo')}
            accion={
              <Boton tamano="compacto" onClick={() => navigate('/verificacion-identidad')}>
                {t('inicio.completarKyc')}
              </Boton>
            }
          >
            {t('inicio.kycPendiente')}
          </Aviso>
        )}
      </div>

      <div className={styles.tarjetas}>
        <Tarjeta
          titulo={t('inicio.cotizarTitulo')}
          descripcion={t('inicio.cotizarDescripcion')}
          icono={<IconoCotizar />}
          onClick={() => navigate('/cotizacion')}
          deshabilitada={!puedeCotizar(estado)}
          motivoBloqueo={t('inicio.bloqueoSinConexion')}
        />
        <Tarjeta
          titulo={t('inicio.polizasTitulo')}
          descripcion={t('inicio.polizasDescripcion')}
          icono={<IconoPolizas />}
          onClick={() => navigate('/billetera')}
          insignia={polizasSinFirmar(estado).length}
        />
        <Tarjeta
          titulo={t('inicio.consentimientoTitulo')}
          descripcion={
            estado.consentimiento.otorgado
              ? t('inicio.consentimientoActivo')
              : t('inicio.consentimientoInactivo')
          }
          icono={<IconoConsentimiento />}
          onClick={() => navigate('/consentimiento')}
          deshabilitada={estado.debug.sinConexion}
          motivoBloqueo={t('inicio.bloqueoSinConexion')}
        />
        <Tarjeta
          titulo={t('inicio.biometriaTitulo')}
          descripcion={
            estado.usuario.biometriaActiva
              ? t('inicio.biometriaActiva')
              : t('inicio.biometriaDescripcion')
          }
          icono={<IconoBiometria />}
          onClick={() => navigate('/configuracion-biometria')}
          deshabilitada={necesitaVerificacion(estado)}
          motivoBloqueo={t('inicio.bloqueoRequiereKyc')}
        />
      </div>

      <div className={styles.pie}>
        <Boton variante="texto" onClick={salir}>
          {t('inicio.cerrarSesion')}
        </Boton>
      </div>
    </div>
  );
}
