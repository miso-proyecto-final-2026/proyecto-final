import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import { ESTADOS_KYC } from '../../estado/estadoInicial';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { reintentarKyc } from '../../estado/acciones';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

function IconoExitoGrande() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M20 33 28 41 45 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoErrorGrande() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="23" y1="23" x2="41" y2="41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="41" y1="23" x2="23" y2="41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Resultado de H02 (H03): se ramifica segun estado.usuario.estadoKyc. */
export default function ResultadoVerificacion() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTextos();

  const [mostrarSoporteFueraDeAlcance, setMostrarSoporteFueraDeAlcance] = useState(false);
  const encabezadoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    encabezadoRef.current?.focus();
  }, []);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  const { estadoKyc } = estado.usuario;
  if (estadoKyc === ESTADOS_KYC.NO_INICIADO || estadoKyc === ESTADOS_KYC.EN_PROCESO) {
    return <Navigate to="/verificacion-identidad" replace />;
  }

  const aprobado = estadoKyc === ESTADOS_KYC.APROBADO;

  function reintentar() {
    dispatch(reintentarKyc());
    navigate('/verificacion-identidad', { replace: true });
  }

  return (
    <div className={styles.pantalla}>
      <div className={styles.contenido}>
        {aprobado ? (
          <>
            <span className={styles.iconoExito} aria-hidden="true">
              <IconoExitoGrande />
            </span>
            <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
              {t('resultadoVerificacion.tituloAprobado')}
            </h1>
            <p className={styles.detalle}>{t('resultadoVerificacion.detalleAprobado')}</p>
          </>
        ) : (
          <>
            <span className={styles.iconoError} aria-hidden="true">
              <IconoErrorGrande />
            </span>
            <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
              {t('resultadoVerificacion.tituloRechazado')}
            </h1>
            <Aviso tono="error">
              {t(`resultadoVerificacion.motivo.${estado.usuario.motivoRechazoKyc}`)}
            </Aviso>
            <p className={styles.detalle}>{t('resultadoVerificacion.queHacer')}</p>
          </>
        )}
      </div>

      <div className={styles.acciones}>
        {aprobado ? (
          <>
            <Boton anchoCompleto onClick={() => navigate('/configuracion-biometria')}>
              {t('resultadoVerificacion.activarBiometria')}
            </Boton>
            <Boton variante="secundario" anchoCompleto onClick={() => navigate('/inicio')}>
              {t('resultadoVerificacion.irInicio')}
            </Boton>
          </>
        ) : (
          <>
            <Boton anchoCompleto onClick={reintentar}>
              {t('resultadoVerificacion.reintentar')}
            </Boton>
            <Boton variante="secundario" anchoCompleto onClick={() => navigate('/inicio')}>
              {t('resultadoVerificacion.irInicio')}
            </Boton>
            <Boton
              variante="texto"
              anchoCompleto
              onClick={() => setMostrarSoporteFueraDeAlcance(true)}
            >
              {t('resultadoVerificacion.contactarSoporte')}
            </Boton>
            {mostrarSoporteFueraDeAlcance && (
              <p role="status" className={styles.soporteFueraDeAlcance}>
                {t('resultadoVerificacion.soporteFueraDeAlcance')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
