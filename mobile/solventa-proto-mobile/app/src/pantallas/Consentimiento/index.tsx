import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Cargando from '../../componentes/Cargando';
import Interruptor from '../../componentes/Interruptor';
import Selector from '../../componentes/Selector';
import { ESTADOS_COTIZACION } from '../../estado/estadoInicial';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import {
  conectarEntidad,
  desconectarEntidad,
  otorgarConsentimiento,
  revocarConsentimiento,
} from '../../estado/acciones';
import {
  consentimientoVigente,
  entidadesConectadas,
  entidadesDisponibles,
} from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { useRegion } from '../../i18n/regiones';
import { useTextos } from '../../i18n/useTextos';
import { conectarOpenFinance } from '../../servicios/falsos';
import styles from './estilos.module.css';

const DATOS = ['dato1', 'dato2', 'dato3', 'dato4'] as const;

function IconoIngresos() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M7 15V5M7 5 3.5 8.5M7 5l3.5 3.5M17 9v10M17 19l3.5-3.5M17 19l-3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoProductos() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconoHistorial() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoComportamiento() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <line x1="5" y1="19" x2="5" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="19" y1="19" x2="19" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const ICONOS_DATOS: Record<(typeof DATOS)[number], () => ReactNode> = {
  dato1: IconoIngresos,
  dato2: IconoProductos,
  dato3: IconoHistorial,
  dato4: IconoComportamiento,
};

function IconoCheckPequeno() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Suma meses a una fecha ISO. Solo para mostrar "vigente hasta": el
 * resultado siempre pasa por useFormato(), nunca se arma un texto a mano. */
function agregarMeses(fechaIso: string, meses: number) {
  const fecha = new Date(fechaIso);
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toISOString();
}

/**
 * Consentimiento Open Finance (H06 / H07). Dos caras segun
 * consentimientoVigente(estado): formulario de autorizacion (primera
 * entidad), o gestion de varias entidades conectadas.
 */
export default function Consentimiento() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const region = useRegion();
  const formato = useFormato();
  const { t } = useTextos();

  const [entidadElegida, setEntidadElegida] = useState('');
  const [agregandoEntidad, setAgregandoEntidad] = useState(false);
  const [autorizoActivo, setAutorizoActivo] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [errorConexionConectar, setErrorConexionConectar] = useState(false);
  const [confirmandoRevocar, setConfirmandoRevocar] = useState(false);
  const [desconectandoCodigo, setDesconectandoCodigo] = useState<string | null>(null);
  const [mostrarRevocadoExito, setMostrarRevocadoExito] = useState(false);

  const confirmacionRef = useRef<HTMLDivElement>(null);
  const desconexionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confirmandoRevocar) {
      confirmacionRef.current?.focus();
    }
  }, [confirmandoRevocar]);

  useEffect(() => {
    if (desconectandoCodigo) {
      desconexionRef.current?.focus();
    }
  }, [desconectandoCodigo]);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  const vigente = consentimientoVigente(estado);
  const disponibles = entidadesDisponibles(estado, region.entidades);
  const entidadObjetoElegida = disponibles.find((e) => e.codigo === entidadElegida);

  async function conectar() {
    if (!entidadObjetoElegida) return;
    setErrorConexionConectar(false);
    setConectando(true);
    const resultado = await conectarOpenFinance(estado.debug, entidadObjetoElegida);
    setConectando(false);

    if (resultado.ok) {
      const entidadDatos = { codigo: entidadObjetoElegida.codigo, nombre: entidadObjetoElegida.nombre };
      if (vigente) {
        dispatch(conectarEntidad(entidadDatos));
        setAgregandoEntidad(false);
      } else {
        dispatch(otorgarConsentimiento(entidadDatos));
      }
      setEntidadElegida('');
      return;
    }
    setErrorConexionConectar(true);
  }

  function confirmarRevocarAutorizacion() {
    dispatch(revocarConsentimiento());
    setConfirmandoRevocar(false);
    setMostrarRevocadoExito(true);
  }

  function confirmarDesconectar() {
    if (!desconectandoCodigo) return;
    const eraLaUltima = estado.consentimiento.entidades.length === 1;
    dispatch(desconectarEntidad(desconectandoCodigo));
    setDesconectandoCodigo(null);
    if (eraLaUltima) {
      setMostrarRevocadoExito(true);
    }
  }

  if (conectando && entidadObjetoElegida) {
    return (
      <div className={styles.pantalla}>
        <Cargando
          mensaje={t('consentimiento.conectando', { entidad: entidadObjetoElegida.nombre })}
          submensaje={t('consentimiento.conectandoDetalle')}
        />
      </div>
    );
  }

  // --- CARA 2: consentimiento vigente (H07) --------------------------------
  if (vigente) {
    const conectadas = entidadesConectadas(estado);
    const hayCotizacionPersonalizadaVigente =
      !!estado.cotizacion &&
      estado.cotizacion.personalizada &&
      estado.cotizacion.estado === ESTADOS_COTIZACION.LISTA;

    const entidadADesconectar = desconectandoCodigo
      ? conectadas.find((e) => e.codigo === desconectandoCodigo)
      : undefined;
    const esUltimaEntidad = conectadas.length === 1;

    return (
      <div className={styles.pantalla}>
        {estado.debug.sinConexion && (
          <Aviso tono="advertencia">{t('consentimiento.sinConexion')}</Aviso>
        )}

        {/* h1 real para el esquema de accesibilidad de la pantalla: el
         * titulo visible vive dentro del Aviso, tal como pide el encargo. */}
        <h1 className={styles.soloLectorPantalla}>{t('consentimiento.activoTitulo')}</h1>
        <Aviso tono="exito" titulo={t('consentimiento.activoTitulo')}>
          {t('consentimiento.activoDetalle')}
        </Aviso>

        <dl className={styles.listaEstado}>
          <div className={styles.filaEstado}>
            <dt>{t('consentimiento.autorizadoEl')}</dt>
            <dd>{formato.fecha(estado.consentimiento.fechaOtorgamiento, 'largo')}</dd>
          </div>
          <div className={styles.filaEstado}>
            <dt>{t('consentimiento.vigenteHasta')}</dt>
            <dd>
              {estado.consentimiento.fechaOtorgamiento &&
                formato.fecha(agregarMeses(estado.consentimiento.fechaOtorgamiento, 12), 'largo')}
            </dd>
          </div>
        </dl>

        <section className={styles.bloque}>
          <h2 className={styles.tituloBloque}>
            {t('consentimiento.entidadesTitulo')} ({conectadas.length})
          </h2>
          <ul className={styles.listaEntidades}>
            {conectadas.map((entidad) => (
              <li key={entidad.codigo} className={styles.itemEntidad}>
                <div className={styles.infoEntidad}>
                  <span className={styles.nombreEntidad}>{entidad.nombre}</span>
                  <span className={styles.fechaEntidad}>
                    {t('consentimiento.conectadaDesde', {
                      fecha: formato.fecha(entidad.fechaConexion, 'corto'),
                    })}
                  </span>
                </div>
                <Boton
                  variante="texto"
                  tamano="compacto"
                  etiquetaAccesible={`${t('consentimiento.desconectar')} ${entidad.nombre}`}
                  onClick={() => setDesconectandoCodigo(entidad.codigo)}
                >
                  {t('consentimiento.desconectar')}
                </Boton>
              </li>
            ))}
          </ul>

          {desconectandoCodigo && entidadADesconectar && (
            <div
              ref={desconexionRef}
              tabIndex={-1}
              role="alertdialog"
              aria-labelledby="consentimiento-desconectar-titulo"
              className={styles.confirmacion}
            >
              <h2 id="consentimiento-desconectar-titulo" className={styles.tituloConfirmacion}>
                {esUltimaEntidad
                  ? t('consentimiento.ultimaEntidadTitulo')
                  : t('consentimiento.desconectarTitulo')}
              </h2>
              <p className={styles.textoConfirmacion}>
                {esUltimaEntidad
                  ? t('consentimiento.ultimaEntidadDetalle')
                  : t('consentimiento.desconectarDetalle', {
                      entidad: entidadADesconectar.nombre,
                    })}
              </p>
              {esUltimaEntidad && hayCotizacionPersonalizadaVigente && (
                <p className={styles.avisoCotizacionVigente}>
                  {t('consentimiento.avisoCotizacionVigente')}
                </p>
              )}
              <div className={styles.confirmacionAcciones}>
                <Boton variante="peligro" onClick={confirmarDesconectar}>
                  {esUltimaEntidad
                    ? t('consentimiento.confirmarRevocar')
                    : t('consentimiento.confirmarDesconectar')}
                </Boton>
                <Boton variante="secundario" onClick={() => setDesconectandoCodigo(null)}>
                  {t('comun.cancelar')}
                </Boton>
              </div>
            </div>
          )}

          <Boton
            variante="secundario"
            anchoCompleto
            deshabilitado={disponibles.length === 0}
            onClick={() => {
              setErrorConexionConectar(false);
              setAgregandoEntidad(true);
            }}
          >
            {t('consentimiento.agregarEntidad')}
          </Boton>
          {disponibles.length === 0 && (
            <p role="status" className={styles.faltanPasos}>
              {t('consentimiento.todasConectadas')}
            </p>
          )}

          {agregandoEntidad && (
            <div className={styles.formularioAgregar}>
              <Selector
                id="nueva-entidad"
                etiqueta={t('consentimiento.elegirEntidad')}
                valor={entidadElegida}
                onChange={setEntidadElegida}
                opciones={disponibles.map((e) => ({ valor: e.codigo, etiqueta: e.nombre }))}
                marcador={t('consentimiento.entidadMarcador')}
              />
              {errorConexionConectar && (
                <Aviso tono="error">{t('errores.sinConexion')}</Aviso>
              )}
              <div className={styles.confirmacionAcciones}>
                <Boton deshabilitado={!entidadObjetoElegida} onClick={conectar}>
                  {t('consentimiento.conectar')}
                </Boton>
                <Boton
                  variante="texto"
                  onClick={() => {
                    setAgregandoEntidad(false);
                    setEntidadElegida('');
                    setErrorConexionConectar(false);
                  }}
                >
                  {t('comun.cancelar')}
                </Boton>
              </div>
            </div>
          )}
        </section>

        <section className={styles.bloque}>
          <h2 className={styles.tituloBloque}>{t('consentimiento.queSeUsa')}</h2>
          <ul className={styles.listaDatos}>
            {DATOS.map((clave) => (
              <li key={clave} className={styles.itemDato}>
                <span className={styles.iconoCheckDato} aria-hidden="true">
                  <IconoCheckPequeno />
                </span>
                <span>{t(`consentimiento.${clave}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <Boton
          variante="peligro"
          anchoCompleto
          deshabilitado={estado.debug.sinConexion}
          onClick={() => setConfirmandoRevocar(true)}
        >
          {t('consentimiento.revocar')}
        </Boton>

        {confirmandoRevocar && (
          <div
            ref={confirmacionRef}
            tabIndex={-1}
            role="alertdialog"
            aria-labelledby="consentimiento-confirmar-titulo"
            className={styles.confirmacion}
          >
            <h2 id="consentimiento-confirmar-titulo" className={styles.tituloConfirmacion}>
              {t('consentimiento.confirmarTitulo')}
            </h2>
            <p className={styles.textoConfirmacion}>{t('consentimiento.confirmarDetalle')}</p>

            {hayCotizacionPersonalizadaVigente && (
              <p className={styles.avisoCotizacionVigente}>
                {t('consentimiento.avisoCotizacionVigente')}
              </p>
            )}

            <div className={styles.confirmacionAcciones}>
              <Boton variante="peligro" onClick={confirmarRevocarAutorizacion}>
                {t('consentimiento.confirmarRevocar')}
              </Boton>
              <Boton variante="secundario" onClick={() => setConfirmandoRevocar(false)}>
                {t('comun.cancelar')}
              </Boton>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- CARA 1: sin consentimiento (H06) -------------------------------------
  const faltanCampos = !entidadObjetoElegida || !autorizoActivo;
  const deshabilitarConectar = faltanCampos || estado.debug.sinConexion;

  return (
    <div className={styles.pantalla}>
      {mostrarRevocadoExito && estado.consentimiento.fechaRevocacion && (
        <Aviso tono="info">
          {t('consentimiento.revocadoExito', {
            fecha: formato.fecha(estado.consentimiento.fechaRevocacion, 'largo'),
          })}
        </Aviso>
      )}

      {estado.debug.sinConexion && (
        <Aviso tono="advertencia">{t('consentimiento.sinConexion')}</Aviso>
      )}

      <div>
        <h1 className={styles.titulo}>{t('consentimiento.titulo')}</h1>
        <p className={styles.introduccion}>{t('consentimiento.introduccion')}</p>
      </div>

      <section className={styles.bloque}>
        <h2 className={styles.tituloBloque}>{t('consentimiento.queDatos')}</h2>
        <ul className={styles.listaDatos}>
          {DATOS.map((clave) => {
            const Icono = ICONOS_DATOS[clave];
            return (
              <li key={clave} className={styles.itemDato}>
                <span className={styles.iconoDato} aria-hidden="true">
                  <Icono />
                </span>
                <span>{t(`consentimiento.${clave}`)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.tituloBloque}>{t('consentimiento.finalidad')}</h2>
        <p className={styles.textoBloque}>{t('consentimiento.finalidadDetalle')}</p>
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.tituloBloque}>{t('consentimiento.vigencia')}</h2>
        <p className={styles.textoBloque}>{t('consentimiento.vigenciaDetalle')}</p>
      </section>

      <Aviso tono="info">{t('consentimiento.avisoRevocable')}</Aviso>

      <section className={styles.bloque}>
        <p className={styles.textoBloque}>{t('consentimiento.elegirEntidadDetalle')}</p>
        <Selector
          id="entidad"
          etiqueta={t('consentimiento.elegirEntidad')}
          valor={entidadElegida}
          onChange={setEntidadElegida}
          opciones={disponibles.map((e) => ({ valor: e.codigo, etiqueta: e.nombre }))}
          marcador={t('consentimiento.entidadMarcador')}
        />
      </section>

      <Interruptor
        id="autorizacion"
        etiqueta={t('consentimiento.autorizo')}
        descripcion={t('consentimiento.autorizoDetalle')}
        activo={autorizoActivo}
        onChange={setAutorizoActivo}
      />

      {errorConexionConectar && <Aviso tono="error">{t('errores.sinConexion')}</Aviso>}

      <div className={styles.acciones}>
        <Boton anchoCompleto deshabilitado={deshabilitarConectar} onClick={conectar}>
          {t('consentimiento.conectar')}
        </Boton>
        {faltanCampos && (
          <p role="status" className={styles.faltanPasos}>
            {t('consentimiento.faltanPasos')}
          </p>
        )}
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/inicio')}>
          {t('comun.atras')}
        </Boton>
      </div>
    </div>
  );
}
