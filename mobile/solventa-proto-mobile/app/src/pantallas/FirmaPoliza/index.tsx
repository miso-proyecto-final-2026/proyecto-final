import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Cargando from '../../componentes/Cargando';
import Interruptor from '../../componentes/Interruptor';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { emitirCertificado, firmarPoliza } from '../../estado/acciones';
import { polizasSinFirmar } from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { useTextos } from '../../i18n/useTextos';
import { emitirCertificadoDoc, firmarDocumento } from '../../servicios/falsos';
import styles from './estilos.module.css';

type Fase = 'reposo' | 'firmando' | 'emitiendo';

/**
 * Firma electronica de la poliza (H21) y emision inmediata del certificado
 * (H22). La firma es una cosa y la emision otra: si la emision falla, la
 * poliza queda firmada sin certificado y ConfirmacionCertificado lo
 * contempla. "Firmar mas tarde" es una salida legitima: la poliza queda sin
 * firmar y visible en la billetera.
 */
export default function FirmaPoliza() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const formato = useFormato();
  const { t } = useTextos();

  const [leido, setLeido] = useState(false);
  const [fase, setFase] = useState<Fase>('reposo');
  const [errorFirma, setErrorFirma] = useState(false);
  const montada = useRef(true);

  // Referencia de pago que trae Pago; se reenvia a la confirmacion final.
  const referencia: string | undefined = location.state?.referencia;

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  // Van ANTES de las guardias a proposito: firmarPoliza saca la poliza de
  // polizasSinFirmar, y sin esto la guardia "no hay poliza por firmar"
  // mandaria a /billetera a mitad de la emision del certificado.
  if (fase === 'firmando') {
    return (
      <div className={styles.pantalla}>
        <Cargando mensaje={t('firma.firmando')} />
      </div>
    );
  }
  if (fase === 'emitiendo') {
    return (
      <div className={styles.pantalla}>
        <Cargando mensaje={t('firma.emitiendo')} />
      </div>
    );
  }

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }
  // La poliza objetivo es la mas reciente sin firmar (se agregan al final).
  const sinFirmar = polizasSinFirmar(estado);
  const poliza = sinFirmar[sinFirmar.length - 1];
  if (!poliza) {
    return <Navigate to="/billetera" replace />;
  }

  const coberturas: string[] = poliza.coberturas ?? [];
  const clausulas = t('firma.clausulas').split('\n');
  const idPoliza: string = poliza.id;

  async function firmar() {
    setErrorFirma(false);
    setFase('firmando');

    const firma = await firmarDocumento(estado.debug);
    if (!firma.ok) {
      setFase('reposo');
      setErrorFirma(true);
      return;
    }

    setFase('emitiendo');
    dispatch(firmarPoliza(idPoliza));

    // El certificado se emite de inmediato. Si falla, la poliza queda
    // firmada sin certificado y se sigue igual a la confirmacion.
    const emision = await emitirCertificadoDoc(estado.debug);
    if (emision.ok) {
      // Esta accion genera la notificacion de H22: el BannerPush la muestra
      // solo, desde App.
      dispatch(emitirCertificado(idPoliza));
    }

    if (montada.current) {
      navigate('/confirmacion-certificado', {
        replace: true,
        state: { polizaId: idPoliza, referencia },
      });
    }
  }

  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>{t('firma.titulo')}</h1>
        <p className={styles.introduccion}>{t('firma.introduccion')}</p>
      </div>

      {/* Region con scroll propio: tabIndex 0 la hace alcanzable con teclado
       * y role="region" hace valido su aria-label. */}
      <div
        className={styles.documento}
        tabIndex={0}
        role="region"
        aria-label={t('firma.documentoEtiqueta')}
      >
        <h2 className={styles.documentoTitulo}>
          {t('firma.polizaEncabezado', {
            numero: poliza.numero,
            ramo: t(`seguros.${poliza.tipo}`),
          })}
        </h2>

        {clausulas.map((clausula: string, indice: number) => (
          <p key={indice} className={styles.clausula}>
            {clausula}
          </p>
        ))}

        <h3 className={styles.subtitulo}>{t('firma.coberturasTitulo')}</h3>
        <ul className={styles.coberturas}>
          {coberturas.map((clave) => (
            <li key={clave}>{t(`coberturas.${clave}`)}</li>
          ))}
        </ul>

        <dl className={styles.datos}>
          <div className={styles.fila}>
            <dt>{t('firma.primaMensual')}</dt>
            <dd>{formato.moneda(poliza.prima)}</dd>
          </div>
          <div className={styles.fila}>
            <dt>{t('firma.vigencia')}</dt>
            <dd>{t('firma.vigenciaValor', { fecha: formato.fecha(poliza.vigenciaDesde, 'largo') })}</dd>
          </div>
        </dl>
      </div>

      <Interruptor
        id="firma-he-leido"
        etiqueta={t('firma.heLeido')}
        activo={leido}
        onChange={setLeido}
      />

      {errorFirma && (
        <Aviso
          tono="error"
          accion={
            <Boton tamano="compacto" onClick={firmar}>
              {t('firma.reintentar')}
            </Boton>
          }
        >
          {t('errores.sinConexion')}
        </Aviso>
      )}

      <div className={styles.acciones}>
        <Boton anchoCompleto deshabilitado={!leido} onClick={firmar}>
          {t('firma.firmar')}
        </Boton>
        {!leido && (
          <p role="status" className={styles.debeConfirmar}>
            {t('firma.debeConfirmar')}
          </p>
        )}
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/billetera')}>
          {t('firma.masTarde')}
        </Boton>
      </div>
    </div>
  );
}
