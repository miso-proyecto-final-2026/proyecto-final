import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import { ESTADOS_COTIZACION } from '../../estado/estadoInicial';
import { useEstado } from '../../estado/StoreProvider';
import {
  cotizacionActiva,
  cotizacionInvalidada,
  necesitaVerificacion,
  puedeComprar,
  requiereConsentimientoParaComprar,
} from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { PARAMETROS_RAMO } from '../../i18n/regiones/parametrosRamo';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

type ParametroRamo = (typeof PARAMETROS_RAMO)[string][number];

function IconoCheck() {
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

/**
 * Resultado de la cotizacion (H37). Tres estados de la oferta:
 *  - invalidada / vencida: la oferta ya no se puede contratar; solo se puede
 *    cotizar de nuevo.
 *  - estimada: se calculo sin datos financieros; el precio puede variar.
 *  - firme: se calculo con consentimiento vigente.
 * La certeza siempre se dice con una etiqueta de texto, nunca solo con color.
 */
export default function ResultadoCotizacion() {
  const estado = useEstado();
  const navigate = useNavigate();
  const formato = useFormato();
  const { t } = useTextos();

  const cotizacion = cotizacionActiva(estado);

  // Sin una oferta terminada (no hay, o quedo calculando / con error) no hay
  // nada que mostrar: se vuelve a cotizar.
  if (
    !cotizacion ||
    (cotizacion.estado !== ESTADOS_COTIZACION.LISTA &&
      cotizacion.estado !== ESTADOS_COTIZACION.INVALIDADA &&
      cotizacion.estado !== ESTADOS_COTIZACION.VENCIDA)
  ) {
    return <Navigate to="/cotizacion" replace />;
  }

  const nombreRamo = t(`seguros.${cotizacion.tipoSeguro}`);

  // --- Oferta que ya no se puede contratar: invalidada (H07) o vencida --------
  const vencida = cotizacion.estado === ESTADOS_COTIZACION.VENCIDA;
  if (cotizacionInvalidada(estado) || vencida) {
    return (
      <div className={styles.pantalla}>
        <Aviso tono="advertencia">
          {vencida
            ? t('resultadoCotizacion.vencida', {
                fecha: formato.fecha(cotizacion.vigenciaHasta, 'largo'),
              })
            : t('resultadoCotizacion.invalidada')}
        </Aviso>

        <div className={styles.encabezado}>
          <h1 className={styles.titulo}>{t('resultadoCotizacion.titulo')}</h1>
          <p className={styles.ramo}>{nombreRamo}</p>
        </div>

        <div className={styles.bloquePrima}>
          <p className={styles.periodicidad}>{t('resultadoCotizacion.periodicidad')}</p>
          <p className={`${styles.prima} ${styles.primaTachada}`}>
            <s>{formato.moneda(cotizacion.prima)}</s>
          </p>
        </div>

        <div className={styles.acciones}>
          <Boton anchoCompleto onClick={() => navigate('/cotizacion/nueva')}>
            {t('resultadoCotizacion.cotizarDeNuevo')}
          </Boton>
          <Boton variante="texto" anchoCompleto onClick={() => navigate('/cotizacion')}>
            {t('resultadoCotizacion.verHistorial')}
          </Boton>
        </div>
      </div>
    );
  }

  // --- Oferta vigente (firme o estimada) --------------------------------------
  const definiciones: ParametroRamo[] = PARAMETROS_RAMO[cotizacion.tipoSeguro] ?? [];
  const parametros: Record<string, string | number> = cotizacion.parametros ?? {};
  const coberturas: string[] = cotizacion.coberturas ?? [];

  const puedeContratar = puedeComprar(estado);
  const requiereConsentimiento = requiereConsentimientoParaComprar(estado);
  const requiereVerificacion = necesitaVerificacion(estado);
  const sinConexion = estado.debug.sinConexion;

  function valorLegible(definicion: ParametroRamo): string {
    const valor = parametros[definicion.nombre];
    if (definicion.tipo === 'selector') {
      return t(`cotizacion.opciones.${definicion.nombre}.${valor}`);
    }
    return definicion.tipo === 'moneda' ? formato.moneda(valor) : formato.numero(valor);
  }

  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>{t('resultadoCotizacion.titulo')}</h1>
        <p className={styles.ramo}>{nombreRamo}</p>
      </div>

      <div className={styles.bloquePrima}>
        <p className={styles.periodicidad}>{t('resultadoCotizacion.periodicidad')}</p>
        <p className={styles.prima}>{formato.moneda(cotizacion.prima)}</p>
        {cotizacion.estimada ? (
          <span className={`${styles.etiqueta} ${styles.etiquetaEstimada}`}>
            {t('resultadoCotizacion.etiquetaEstimada')}
          </span>
        ) : (
          <span className={`${styles.etiqueta} ${styles.etiquetaFirme}`}>
            {t('resultadoCotizacion.etiquetaFirme')}
          </span>
        )}
      </div>

      {cotizacion.estimada && (
        <div className={styles.bloqueEstimada}>
          <Aviso tono="info">{t('resultadoCotizacion.estimadaDetalle')}</Aviso>
          <Boton
            variante="texto"
            onClick={() => navigate('/consentimiento', { state: { volverA: '/cotizacion' } })}
          >
            {t('resultadoCotizacion.autorizarParaFirme')}
          </Boton>
        </div>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>{t('resultadoCotizacion.coberturasTitulo')}</h2>
        <ul className={styles.listaCoberturas}>
          {coberturas.map((clave) => (
            <li key={clave} className={styles.cobertura}>
              <span className={styles.iconoCheck} aria-hidden="true">
                <IconoCheck />
              </span>
              <span>{t(`coberturas.${clave}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>{t('resultadoCotizacion.resumenTitulo')}</h2>
        <dl className={styles.resumen}>
          {definiciones.map((definicion) => (
            <div key={definicion.nombre} className={styles.filaResumen}>
              <dt>{t(definicion.claveEtiqueta)}</dt>
              <dd>{valorLegible(definicion)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.acciones}>
        <Boton anchoCompleto deshabilitado={!puedeContratar} onClick={() => navigate('/pago')}>
          {t('resultadoCotizacion.contratar')}
        </Boton>

        {/* Antes que el de KYC: si la cotizacion es estimada, ese es el
         * impedimento mas inmediato. */}
        {requiereConsentimiento && (
          <div className={styles.motivo}>
            <p>{t('resultadoCotizacion.requiereConsentimiento')}</p>
            <Boton
              variante="texto"
              tamano="compacto"
              onClick={() => navigate('/consentimiento', { state: { volverA: '/cotizacion' } })}
            >
              {t('resultadoCotizacion.autorizarParaContratar')}
            </Boton>
          </div>
        )}
        {requiereVerificacion && (
          <div className={styles.motivo}>
            <p>{t('resultadoCotizacion.requiereKyc')}</p>
            <Boton
              variante="texto"
              tamano="compacto"
              onClick={() => navigate('/verificacion-identidad')}
            >
              {t('resultadoCotizacion.verificarIdentidad')}
            </Boton>
          </div>
        )}
        {sinConexion && (
          <div className={styles.motivo}>
            <p>{t('errores.sinConexion')}</p>
          </div>
        )}

        {/* La cotizacion actual se conserva en el historial: no se descarta. */}
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/cotizacion/nueva')}>
          {t('resultadoCotizacion.nuevaCotizacion')}
        </Boton>
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/cotizacion')}>
          {t('resultadoCotizacion.verHistorial')}
        </Boton>
      </div>
    </div>
  );
}
