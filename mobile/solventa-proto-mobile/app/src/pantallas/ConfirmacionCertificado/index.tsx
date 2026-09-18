import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import { useEstado } from '../../estado/StoreProvider';
import { useFormato } from '../../i18n/formato';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

function IconoExito() {
  return (
    <svg viewBox="0 0 24 24" width="64" height="64" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 12.5 11 15.5 16 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Reloj: la poliza esta firmada y el certificado todavia no llega. */
function IconoPendiente() {
  return (
    <svg viewBox="0 0 24 24" width="64" height="64" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Confirmacion final de la compra (H22). Dos casos segun la poliza:
 *  - con certificado: la compra termino.
 *  - sin certificado: la poliza quedo firmada pero la emision fallo; el
 *    certificado llegara despues (no hay descarga).
 */
export default function ConfirmacionCertificado() {
  const estado = useEstado();
  const navigate = useNavigate();
  const location = useLocation();
  const formato = useFormato();
  const { t } = useTextos();

  const [mostrarDescarga, setMostrarDescarga] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Foco al <h1> al montar: es una pantalla a la que se llega por
  // navegacion automatica y hay que anunciarla.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  // La poliza viene en location.state; si no, la mas reciente.
  const idPedido: string | undefined = location.state?.polizaId;
  const referencia: string | undefined = location.state?.referencia;
  const polizas = estado.polizas;
  const poliza = polizas.find((p: { id: string }) => p.id === idPedido) ?? polizas[polizas.length - 1];
  if (!poliza) {
    return <Navigate to="/billetera" replace />;
  }

  const conCertificado = !!poliza.certificado;

  function verPoliza() {
    navigate('/detalle-poliza', { state: { polizaId: poliza.id } });
  }

  // --- La emision fallo: firmada, sin certificado ---------------------------
  if (!conCertificado) {
    return (
      <div className={styles.pantalla}>
        <div className={styles.cabecera}>
          <span className={styles.iconoNeutro}>
            <IconoPendiente />
          </span>
          <h1 ref={tituloRef} tabIndex={-1} className={styles.titulo}>
            {t('certificado.tituloPendiente')}
          </h1>
        </div>

        <Aviso tono="info">{t('certificado.pendienteDetalle')}</Aviso>

        <div className={styles.acciones}>
          <Boton anchoCompleto onClick={verPoliza}>
            {t('certificado.verPoliza')}
          </Boton>
          <Boton variante="texto" anchoCompleto onClick={() => navigate('/inicio')}>
            {t('certificado.irInicio')}
          </Boton>
        </div>
      </div>
    );
  }

  // --- Compra completa -------------------------------------------------------
  return (
    <div className={styles.pantalla}>
      <div className={styles.cabecera}>
        <span className={styles.iconoExito}>
          <IconoExito />
        </span>
        <h1 ref={tituloRef} tabIndex={-1} className={styles.titulo}>
          {t('certificado.titulo')}
        </h1>
      </div>

      <dl className={styles.datos}>
        <div className={styles.fila}>
          <dt>{t('certificado.numero')}</dt>
          <dd>{poliza.numero}</dd>
        </div>
        <div className={styles.fila}>
          <dt>{t('certificado.ramo')}</dt>
          <dd>{t(`seguros.${poliza.tipo}`)}</dd>
        </div>
        <div className={styles.fila}>
          <dt>{t('certificado.prima')}</dt>
          <dd>{formato.moneda(poliza.prima)}</dd>
        </div>
        <div className={styles.fila}>
          <dt>{t('certificado.vigenciaDesde')}</dt>
          <dd>{formato.fecha(poliza.vigenciaDesde, 'largo')}</dd>
        </div>
        <div className={styles.fila}>
          <dt>{t('certificado.vigenciaHasta')}</dt>
          <dd>{formato.fecha(poliza.vigenciaHasta, 'largo')}</dd>
        </div>
        {referencia && (
          <div className={styles.fila}>
            <dt>{t('certificado.referencia')}</dt>
            <dd>{referencia}</dd>
          </div>
        )}
      </dl>

      <div className={styles.acciones}>
        <div className={styles.grupoDescarga}>
          <Boton anchoCompleto onClick={() => setMostrarDescarga(true)}>
            {t('certificado.descargar')}
          </Boton>
          {/* La region viva existe siempre y se llena al pulsar: una region
           * que aparece ya con texto no siempre se anuncia. */}
          <p role="status" className={styles.descarga}>
            {mostrarDescarga ? t('certificado.descargaFueraDeAlcance') : ''}
          </p>
        </div>
        <Boton variante="secundario" anchoCompleto onClick={verPoliza}>
          {t('certificado.verPoliza')}
        </Boton>
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/inicio')}>
          {t('certificado.irInicio')}
        </Boton>
      </div>
    </div>
  );
}
