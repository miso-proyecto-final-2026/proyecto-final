import { useEffect, useId, useRef } from 'react';
import Boton from '../Boton';
import styles from './estilos.module.css';

/**
 * Tono de la etiqueta de estado:
 *  - firme / estimada: oferta vigente, segun se calculo con o sin consentimiento.
 *  - vencida / invalidada: la oferta ya no se puede contratar.
 */
export type TonoEtiqueta = 'firme' | 'estimada' | 'vencida' | 'invalidada';

export interface EtiquetaItem {
  /** Ya traducido. El estado nunca se dice solo con color: siempre hay texto. */
  texto: string;
  tono: TonoEtiqueta;
}

interface ItemCotizacionProps {
  /** Ya traducido: nombre del ramo. */
  titulo: string;
  /** Ya formateada con useFormato().moneda. */
  prima: string;
  /** Ya traducido y con la fecha formateada: p.ej. "Creada el 3/10/26". */
  fecha: string;
  etiqueta: EtiquetaItem;
  /** Ya traducido: "Vigente hasta ...". Solo en cotizaciones vigentes. */
  vigencia?: string;
  /** Ya traducido: por que ya no sirve. Solo en cotizaciones invalidadas. */
  motivo?: string;
  /** Abre el detalle: toda el area de informacion es un unico boton. */
  onAbrir: () => void;

  textoEliminar: string;
  /** Ya traducido; debe incluir el ramo para distinguir un boton de otro. */
  etiquetaEliminar: string;
  /** true muestra la confirmacion en linea en lugar del boton de eliminar. */
  confirmando: boolean;
  /** Ya traducido: la pregunta de la confirmacion. */
  textoConfirmacion: string;
  textoCancelar: string;
  onPedirEliminar: () => void;
  onConfirmarEliminar: () => void;
  onCancelarEliminar: () => void;
}

/**
 * Tarjeta del historial de cotizaciones. El area de informacion y la accion
 * de eliminar son DOS elementos hermanos, nunca uno dentro del otro: un
 * boton anidado en otro boton no es HTML valido ni accesible. No usa
 * useTextos: todo llega ya traducido.
 *
 * La confirmacion de eliminar es en linea (role="alertdialog"): al aparecer
 * recibe el foco, y si se cancela el foco vuelve al boton que la abrio.
 */
export default function ItemCotizacion({
  titulo,
  prima,
  fecha,
  etiqueta,
  vigencia,
  motivo,
  onAbrir,
  textoEliminar,
  etiquetaEliminar,
  confirmando,
  textoConfirmacion,
  textoCancelar,
  onPedirEliminar,
  onConfirmarEliminar,
  onCancelarEliminar,
}: ItemCotizacionProps) {
  const idConfirmacion = useId();
  const confirmacionRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLDivElement>(null);
  const estabaConfirmando = useRef(false);

  useEffect(() => {
    if (confirmando) {
      confirmacionRef.current?.focus();
    } else if (estabaConfirmando.current) {
      // Se cancelo: el boton de eliminar vuelve a montarse y recupera el foco.
      disparadorRef.current?.querySelector('button')?.focus();
    }
    estabaConfirmando.current = confirmando;
  }, [confirmando]);

  return (
    <div className={styles.item}>
      <button type="button" className={styles.abrir} onClick={onAbrir}>
        <span className={styles.titulo}>{titulo}</span>
        <span className={styles.prima}>{prima}</span>
        <span className={`${styles.etiqueta} ${styles[`etiqueta_${etiqueta.tono}`]}`}>
          {etiqueta.texto}
        </span>
        <span className={styles.detalle}>{fecha}</span>
        {vigencia && <span className={styles.detalle}>{vigencia}</span>}
        {motivo && <span className={styles.motivo}>{motivo}</span>}
      </button>

      {confirmando ? (
        <div
          ref={confirmacionRef}
          tabIndex={-1}
          role="alertdialog"
          aria-labelledby={idConfirmacion}
          className={styles.confirmacion}
        >
          <p id={idConfirmacion} className={styles.textoConfirmacion}>
            {textoConfirmacion}
          </p>
          <div className={styles.accionesConfirmacion}>
            <Boton variante="peligro" tamano="compacto" onClick={onConfirmarEliminar}>
              {textoEliminar}
            </Boton>
            <Boton variante="texto" tamano="compacto" onClick={onCancelarEliminar}>
              {textoCancelar}
            </Boton>
          </div>
        </div>
      ) : (
        <div ref={disparadorRef} className={styles.pie}>
          <Boton
            variante="texto"
            tamano="compacto"
            etiquetaAccesible={etiquetaEliminar}
            onClick={onPedirEliminar}
          >
            {textoEliminar}
          </Boton>
        </div>
      )}
    </div>
  );
}
