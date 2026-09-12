import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Cargando from '../../componentes/Cargando';
import IndicadorPasos from '../../componentes/IndicadorPasos';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { iniciarKyc, reintentarKyc, resolverKyc } from '../../estado/acciones';
import { kycAprobado, verificacionRechazada } from '../../estado/selectores';
import { useRegion } from '../../i18n/regiones';
import { useTextos } from '../../i18n/useTextos';
import { verificarIdentidad } from '../../servicios/falsos';
import styles from './estilos.module.css';

type IdPaso = 'instrucciones' | 'frente' | 'reverso' | 'selfie';
type EstadoCaptura = 'vacio' | 'detectando' | 'capturado';

/** Cuatro esquinas en angulo: sugieren el encuadre, sin usar camara real. */
function EsquinasEncuadre() {
  return (
    <svg
      className={styles.esquinas}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 18 V6 H18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M82 6 H94 V18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M94 82 V94 H82" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 94 H6 V82" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconoCheckGrande() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M15 24.5 21 30.5 33 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoLuz() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoSinReflejos() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="19" x2="20" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoEncuadreConsejo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marco de captura simulado: sin camara real, sin getUserMedia. */
function MarcoCaptura({
  ovalado = false,
  estadoCaptura,
  etiqueta,
  textoDetectando,
  textoCapturado,
}: {
  ovalado?: boolean;
  estadoCaptura: EstadoCaptura;
  etiqueta: string;
  textoDetectando?: string;
  textoCapturado: string;
}) {
  const clases = [
    styles.marco,
    ovalado ? styles.marcoOvalado : styles.marcoRectangular,
    estadoCaptura === 'capturado' ? styles.marcoCapturado : '',
    estadoCaptura === 'detectando' ? styles.marcoDetectando : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases}>
      {estadoCaptura === 'vacio' && (
        <>
          {!ovalado && <EsquinasEncuadre />}
          <p className={styles.textoMarco}>{etiqueta}</p>
        </>
      )}
      {estadoCaptura === 'detectando' && <p className={styles.textoMarco}>{textoDetectando}</p>}
      {estadoCaptura === 'capturado' && (
        <>
          <IconoCheckGrande />
          <p className={styles.textoMarcoCapturado}>{textoCapturado}</p>
        </>
      )}
    </div>
  );
}

/**
 * Verificacion de identidad (H02). Pasos internos con estado local, no
 * rutas: 4 pasos normalmente, 3 si el documento es pasaporte (se omite el
 * reverso). Las capturas son simuladas: no se guardan en el estado global.
 */
export default function VerificacionIdentidad() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const region = useRegion();
  const { t } = useTextos();

  const esPasaporte = estado.usuario.tipoDocumento === 'PA';
  const secuenciaPasos: IdPaso[] = esPasaporte
    ? ['instrucciones', 'frente', 'selfie']
    : ['instrucciones', 'frente', 'reverso', 'selfie'];

  const [indicePaso, setIndicePaso] = useState(0);
  const [capturas, setCapturas] = useState({ frente: false, reverso: false, selfie: false });
  const [detectandoSelfie, setDetectandoSelfie] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  const encabezadoRef = useRef<HTMLHeadingElement>(null);
  const esPrimeraRenderizacion = useRef(true);
  const temporizadorDetectarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yaReintentoRef = useRef(false);

  // Al montar: si la verificacion anterior fue rechazada, se resetea para
  // permitir un nuevo intento. Solo una vez, no en cada render.
  useEffect(() => {
    if (!yaReintentoRef.current && verificacionRechazada(estado)) {
      yaReintentoRef.current = true;
      dispatch(reintentarKyc());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foco en el <h1> al cambiar de paso (el .focus() ya hace scroll-into-view).
  useEffect(() => {
    if (esPrimeraRenderizacion.current) {
      esPrimeraRenderizacion.current = false;
      return;
    }
    encabezadoRef.current?.focus();
  }, [indicePaso]);

  useEffect(() => {
    return () => {
      if (temporizadorDetectarRef.current) clearTimeout(temporizadorDetectarRef.current);
    };
  }, []);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }
  if (kycAprobado(estado)) {
    return <Navigate to="/inicio" replace />;
  }

  const idPasoActual = secuenciaPasos[indicePaso];
  const esUltimoPaso = indicePaso === secuenciaPasos.length - 1;

  const ETIQUETAS_POR_ID: Record<IdPaso, string> = {
    instrucciones: t('verificacion.paso1'),
    frente: t('verificacion.paso2'),
    reverso: t('verificacion.paso3'),
    selfie: t('verificacion.paso4'),
  };
  const etiquetasPasos = secuenciaPasos.map((id) => ETIQUETAS_POR_ID[id]);

  const tipoDocSeleccionado = region.tiposDocumento.find(
    (tipo) => tipo.valor === estado.usuario.tipoDocumento
  );
  const nombreDocumento = tipoDocSeleccionado ? t(tipoDocSeleccionado.claveEtiqueta) : '';

  function manejarCapturar() {
    if (idPasoActual === 'selfie') {
      setDetectandoSelfie(true);
      temporizadorDetectarRef.current = setTimeout(() => {
        setDetectandoSelfie(false);
        setCapturas((c) => ({ ...c, selfie: true }));
      }, 1500);
      return;
    }
    setCapturas((c) => ({ ...c, [idPasoActual]: true }));
  }

  function manejarRepetir() {
    setCapturas((c) => ({ ...c, [idPasoActual]: false }));
  }

  function manejarAtras() {
    setIndicePaso((i) => Math.max(0, i - 1));
  }

  async function enviarVerificacion() {
    setErrorConexion(false);
    dispatch(iniciarKyc());
    setEnviando(true);
    const resultado = await verificarIdentidad(estado.debug);
    setEnviando(false);

    if (resultado.ok) {
      dispatch(resolverKyc(true));
      navigate('/resultado-verificacion', { replace: true });
      return;
    }

    if (resultado.motivo === 'documento_ilegible') {
      dispatch(resolverKyc(false, 'documento_ilegible'));
      navigate('/resultado-verificacion', { replace: true });
      return;
    }

    // 'sin_conexion': no se despacha resolverKyc. Se queda en el paso 4.
    setErrorConexion(true);
    setIndicePaso(secuenciaPasos.length - 1);
  }

  function manejarContinuar() {
    if (esUltimoPaso) {
      enviarVerificacion();
      return;
    }
    setIndicePaso((i) => i + 1);
  }

  if (enviando) {
    return (
      <div className={styles.pantalla}>
        <Cargando
          mensaje={t('verificacion.procesando')}
          submensaje={t('verificacion.procesandoDetalle')}
        />
      </div>
    );
  }

  const estaCapturado =
    idPasoActual === 'frente'
      ? capturas.frente
      : idPasoActual === 'reverso'
        ? capturas.reverso
        : idPasoActual === 'selfie'
          ? capturas.selfie
          : false;

  return (
    <div className={styles.pantalla}>
      <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
        {t('verificacion.titulo')}
      </h1>

      <IndicadorPasos
        pasoActual={indicePaso + 1}
        totalPasos={secuenciaPasos.length}
        etiquetas={etiquetasPasos}
      />

      <p role="status" className={styles.soloLectorPantalla}>
        {etiquetasPasos[indicePaso]}
      </p>

      {idPasoActual === 'instrucciones' && (
        <div className={styles.contenidoPaso}>
          <p className={styles.introduccion}>{t('verificacion.introduccion')}</p>

          <ul className={styles.consejos}>
            <li className={styles.consejo}>
              <span aria-hidden="true">
                <IconoLuz />
              </span>
              <span>{t('verificacion.consejo1')}</span>
            </li>
            <li className={styles.consejo}>
              <span aria-hidden="true">
                <IconoSinReflejos />
              </span>
              <span>{t('verificacion.consejo2')}</span>
            </li>
            <li className={styles.consejo}>
              <span aria-hidden="true">
                <IconoEncuadreConsejo />
              </span>
              <span>{t('verificacion.consejo3')}</span>
            </li>
          </ul>

          <Aviso tono="info">{t('verificacion.avisoDatos')}</Aviso>

          <div className={styles.acciones}>
            <Boton anchoCompleto onClick={manejarContinuar}>
              {t('comun.continuar')}
            </Boton>
            <Boton variante="texto" anchoCompleto onClick={() => navigate('/inicio')}>
              {t('verificacion.masTarde')}
            </Boton>
          </div>
        </div>
      )}

      {(idPasoActual === 'frente' || idPasoActual === 'reverso') && (
        <div className={styles.contenidoPaso}>
          <h2 className={styles.subtitulo}>
            {idPasoActual === 'frente'
              ? t('verificacion.documentoFrente')
              : t('verificacion.documentoReverso')}
          </h2>

          <MarcoCaptura
            estadoCaptura={estaCapturado ? 'capturado' : 'vacio'}
            etiqueta={nombreDocumento}
            textoCapturado={t('verificacion.capturado')}
          />

          <p className={styles.instruccionPaso}>{t('verificacion.instruccionDocumento')}</p>

          {estaCapturado ? (
            <div className={styles.acciones}>
              <Boton variante="secundario" anchoCompleto onClick={manejarRepetir}>
                {t('verificacion.repetir')}
              </Boton>
              <Boton anchoCompleto onClick={manejarContinuar}>
                {t('comun.continuar')}
              </Boton>
            </div>
          ) : (
            <div className={styles.acciones}>
              <Boton anchoCompleto onClick={manejarCapturar}>
                {t('verificacion.capturar')}
              </Boton>
            </div>
          )}

          <Boton variante="texto" anchoCompleto onClick={manejarAtras}>
            {t('comun.atras')}
          </Boton>
        </div>
      )}

      {idPasoActual === 'selfie' && (
        <div className={styles.contenidoPaso}>
          <h2 className={styles.subtitulo}>{t('verificacion.selfie')}</h2>

          <MarcoCaptura
            ovalado
            estadoCaptura={
              detectandoSelfie ? 'detectando' : capturas.selfie ? 'capturado' : 'vacio'
            }
            etiqueta={t('verificacion.instruccionSelfie')}
            textoDetectando={t('verificacion.detectando')}
            textoCapturado={t('verificacion.capturado')}
          />

          <p className={styles.instruccionPaso}>{t('verificacion.instruccionSelfie')}</p>

          {errorConexion && <Aviso tono="error">{t('errores.sinConexion')}</Aviso>}

          {capturas.selfie ? (
            <div className={styles.acciones}>
              <Boton variante="secundario" anchoCompleto onClick={manejarRepetir}>
                {t('verificacion.repetir')}
              </Boton>
              <Boton anchoCompleto onClick={manejarContinuar}>
                {t('comun.continuar')}
              </Boton>
            </div>
          ) : (
            <div className={styles.acciones}>
              <Boton anchoCompleto deshabilitado={detectandoSelfie} onClick={manejarCapturar}>
                {t('verificacion.capturar')}
              </Boton>
            </div>
          )}

          <Boton variante="texto" anchoCompleto onClick={manejarAtras}>
            {t('comun.atras')}
          </Boton>
        </div>
      )}
    </div>
  );
}
