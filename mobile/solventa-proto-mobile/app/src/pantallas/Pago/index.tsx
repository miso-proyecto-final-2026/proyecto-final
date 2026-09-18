import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Cargando from '../../componentes/Cargando';
import Selector from '../../componentes/Selector';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { confirmarPago } from '../../estado/acciones';
import { cotizacionActiva, puedeComprar } from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { useTextos } from '../../i18n/useTextos';
import { procesarPago } from '../../servicios/falsos';
import styles from './estilos.module.css';

const MEDIOS = ['tarjeta', 'pse', 'debito'] as const;

/**
 * Pago (H17). Cobra la cotizacion activa y, si sale bien, la convierte en
 * poliza (confirmarPago). No se piden datos de pago: solo el medio.
 *
 * Un pago rechazado NO despacha nada: la cotizacion sigue viva en el
 * historial y se puede reintentar.
 */
export default function Pago() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formato = useFormato();
  const { t } = useTextos();

  const [medio, setMedio] = useState<(typeof MEDIOS)[number]>('tarjeta');
  const [procesando, setProcesando] = useState(false);
  const [motivoError, setMotivoError] = useState<string | null>(null);
  const montada = useRef(true);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  // Va ANTES de las guardias a proposito: confirmarPago elimina la
  // cotizacion, y sin esto la guardia "sin cotizacion activa" mandaria al
  // usuario a /cotizacion justo cuando el pago acaba de salir bien.
  if (procesando) {
    return (
      <div className={styles.pantalla}>
        <Cargando mensaje={t('pago.procesando')} />
      </div>
    );
  }

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }
  const cotizacion = cotizacionActiva(estado);
  if (!cotizacion) {
    return <Navigate to="/cotizacion" replace />;
  }
  // Si ya hay un error en pantalla no se redirige: sin conexion baja
  // puedeComprar, y el aviso de error se perderia antes de leerse.
  if (!puedeComprar(estado) && !motivoError) {
    return <Navigate to="/resultado-cotizacion" replace />;
  }

  const monto = formato.moneda(cotizacion.prima);
  const coberturas: string[] = cotizacion.coberturas ?? [];

  async function confirmar() {
    setMotivoError(null);
    setProcesando(true);
    const resultado = await procesarPago(estado.debug, { medio });

    if (resultado.ok) {
      // Se cobro: la poliza se crea aunque el usuario ya haya salido de la
      // pantalla mientras esperaba. Solo se navega si sigue aqui.
      dispatch(confirmarPago());
      if (montada.current) {
        // replace: ya no hay cotizacion a la que volver.
        navigate('/firma-poliza', {
          replace: true,
          state: { referencia: resultado.datos?.referencia },
        });
      }
      return;
    }

    setProcesando(false);
    setMotivoError(resultado.motivo ?? 'desconocido');
  }

  return (
    <div className={styles.pantalla}>
      <h1 className={styles.titulo}>{t('pago.titulo')}</h1>

      <section className={styles.resumen}>
        <h2 className={styles.ramo}>{t(`seguros.${cotizacion.tipoSeguro}`)}</h2>
        <div className={styles.incluye}>
          <p className={styles.incluyeTitulo}>{t('pago.incluye')}</p>
          <ul className={styles.coberturas}>
            {coberturas.map((clave) => (
              <li key={clave}>{t(`coberturas.${clave}`)}</li>
            ))}
          </ul>
        </div>
        <div className={styles.bloquePrima}>
          <p className={styles.prima}>{monto}</p>
          <p className={styles.periodicidad}>{t('pago.periodicidad')}</p>
        </div>
      </section>

      <Selector
        id="pago-medio"
        etiqueta={t('pago.medioPago')}
        valor={medio}
        onChange={(valor) => setMedio(valor as (typeof MEDIOS)[number])}
        opciones={MEDIOS.map((clave) => ({ valor: clave, etiqueta: t(`pago.medios.${clave}`) }))}
        ayuda={t('pago.avisoSinDatos')}
      />

      {motivoError === 'pago_rechazado' && (
        <Aviso
          tono="error"
          accion={
            <Boton tamano="compacto" onClick={confirmar}>
              {t('pago.reintentar')}
            </Boton>
          }
        >
          {t('errores.pagoRechazado')}
        </Aviso>
      )}
      {motivoError === 'sin_conexion' && <Aviso tono="error">{t('errores.sinConexion')}</Aviso>}
      {motivoError !== null && motivoError !== 'pago_rechazado' && motivoError !== 'sin_conexion' && (
        <Aviso tono="error">{t('errores.generico')}</Aviso>
      )}

      <div className={styles.acciones}>
        <Boton anchoCompleto deshabilitado={estado.debug.sinConexion} onClick={confirmar}>
          {t('pago.confirmar', { monto })}
        </Boton>
        <Boton variante="texto" anchoCompleto onClick={() => navigate('/resultado-cotizacion')}>
          {t('comun.cancelar')}
        </Boton>
      </div>
    </div>
  );
}
