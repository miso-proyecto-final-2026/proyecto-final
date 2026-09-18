import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import ItemCotizacion, { type EtiquetaItem } from '../../componentes/ItemCotizacion';
import { ESTADOS_COTIZACION } from '../../estado/estadoInicial';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { eliminarCotizacion, seleccionarCotizacion } from '../../estado/acciones';
import { consentimientoVigente, cotizacionesOrdenadas } from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

interface CotizacionListada {
  id: string;
  tipoSeguro: string;
  prima: number;
  estimada: boolean;
  estado: string;
  fechaCreacion: string;
  vigenciaHasta: string;
}

/** Solo se listan ofertas terminadas. Las que quedaron calculando o con
 * error no son una oferta: no tienen prima ni algo que abrir. */
const ESTADOS_LISTADOS: string[] = [
  ESTADOS_COTIZACION.LISTA,
  ESTADOS_COTIZACION.VENCIDA,
  ESTADOS_COTIZACION.INVALIDADA,
];

/**
 * Historial de cotizaciones (H37): la lista de todo lo cotizado, con su
 * estado. Es la puerta de entrada de "Cotizar": desde aqui se abre el
 * detalle de una cotizacion o se empieza una nueva.
 */
export default function HistorialCotizaciones() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formato = useFormato();
  const { t } = useTextos();

  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  const cotizaciones: CotizacionListada[] = cotizacionesOrdenadas(estado).filter(
    (c: { estado: string }) => ESTADOS_LISTADOS.includes(c.estado)
  );
  const sinConexion = estado.debug.sinConexion;

  // Hay ofertas estimadas todavia vigentes y el usuario no ha autorizado el
  // uso de sus datos: se le ofrece autorizar (sin presionar: es opcional).
  const mostrarAvisoEstimadas =
    !consentimientoVigente(estado) &&
    cotizaciones.some((c) => c.estimada && c.estado === ESTADOS_COTIZACION.LISTA);

  function etiquetaDe(cotizacion: CotizacionListada): EtiquetaItem {
    switch (cotizacion.estado) {
      case ESTADOS_COTIZACION.VENCIDA:
        return { texto: t('historial.estadoVencida'), tono: 'vencida' };
      case ESTADOS_COTIZACION.INVALIDADA:
        return { texto: t('historial.estadoInvalidada'), tono: 'invalidada' };
      default:
        return cotizacion.estimada
          ? { texto: t('historial.estadoEstimada'), tono: 'estimada' }
          : { texto: t('historial.estadoFirme'), tono: 'firme' };
    }
  }

  function abrir(id: string) {
    dispatch(seleccionarCotizacion(id));
    navigate('/resultado-cotizacion');
  }

  function eliminar(id: string) {
    // El foco pasa a un elemento que sigue existiendo antes de que la
    // tarjeta desaparezca.
    tituloRef.current?.focus();
    dispatch(eliminarCotizacion(id));
    setConfirmandoId(null);
  }

  return (
    <div className={styles.pantalla}>
      <h1 ref={tituloRef} tabIndex={-1} className={styles.titulo}>
        {t('historial.titulo')}
      </h1>

      {cotizaciones.length === 0 ? (
        <p className={styles.vacio}>{t('historial.vacio')}</p>
      ) : (
        <>
          {mostrarAvisoEstimadas && (
            <Aviso
              tono="info"
              accion={
                <Boton
                  variante="texto"
                  tamano="compacto"
                  onClick={() => navigate('/consentimiento', { state: { volverA: '/cotizacion' } })}
                >
                  {t('historial.autorizar')}
                </Boton>
              }
            >
              {t('historial.avisoEstimadas')}
            </Aviso>
          )}

          <ul className={styles.lista}>
            {cotizaciones.map((cotizacion) => {
              const vigente = cotizacion.estado === ESTADOS_COTIZACION.LISTA;
              const invalidada = cotizacion.estado === ESTADOS_COTIZACION.INVALIDADA;
              const ramo = t(`seguros.${cotizacion.tipoSeguro}`);
              return (
                <li key={cotizacion.id}>
                  <ItemCotizacion
                    titulo={ramo}
                    prima={formato.moneda(cotizacion.prima)}
                    fecha={t('historial.creadaEl', {
                      fecha: formato.fecha(cotizacion.fechaCreacion, 'corto'),
                    })}
                    etiqueta={etiquetaDe(cotizacion)}
                    vigencia={
                      vigente
                        ? t('historial.vigenteHasta', {
                            fecha: formato.fecha(cotizacion.vigenciaHasta, 'corto'),
                          })
                        : undefined
                    }
                    motivo={invalidada ? t('historial.motivoInvalidada') : undefined}
                    onAbrir={() => abrir(cotizacion.id)}
                    textoEliminar={t('historial.eliminar')}
                    etiquetaEliminar={`${t('historial.eliminar')}: ${ramo}`}
                    confirmando={confirmandoId === cotizacion.id}
                    textoConfirmacion={t('historial.confirmarEliminar')}
                    textoCancelar={t('comun.cancelar')}
                    onPedirEliminar={() => setConfirmandoId(cotizacion.id)}
                    onConfirmarEliminar={() => eliminar(cotizacion.id)}
                    onCancelarEliminar={() => setConfirmandoId(null)}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Accion principal al pie de la pantalla (ver .nueva en el CSS). */}
      <div className={styles.nueva}>
        <Boton anchoCompleto deshabilitado={sinConexion} onClick={() => navigate('/cotizacion/nueva')}>
          {t('historial.nueva')}
        </Boton>
        {sinConexion && (
          <p role="status" className={styles.sinConexion}>
            {t('historial.sinConexionNueva')}
          </p>
        )}
      </div>
    </div>
  );
}
