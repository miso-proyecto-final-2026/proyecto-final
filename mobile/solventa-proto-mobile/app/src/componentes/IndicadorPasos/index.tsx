import styles from './estilos.module.css';

interface IndicadorPasosProps {
  pasoActual: number;
  totalPasos: number;
  /** Ya traducidas: una por paso, en el mismo orden que los pasos. */
  etiquetas: string[];
}

/**
 * Barra de progreso segmentada para flujos de varios pasos (p.ej. Registro).
 *
 * El color nunca es la unica senal de cual es el paso activo: el texto de
 * abajo siempre nombra el paso actual, para quien no puede distinguir los
 * colores entre si.
 */
export default function IndicadorPasos({
  pasoActual,
  totalPasos,
  etiquetas,
}: IndicadorPasosProps) {
  const etiquetaActual = etiquetas[pasoActual - 1];

  return (
    <div
      className={styles.contenedor}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalPasos}
      aria-valuenow={pasoActual}
      aria-label={etiquetaActual}
    >
      <div className={styles.segmentos}>
        {Array.from({ length: totalPasos }, (_valor, indice) => {
          const numero = indice + 1;
          const clase =
            numero < pasoActual
              ? styles.completado
              : numero === pasoActual
                ? styles.activo
                : '';
          return (
            <span
              key={numero}
              className={[styles.segmento, clase].filter(Boolean).join(' ')}
            />
          );
        })}
      </div>
      <p className={styles.textoPaso}>{etiquetaActual}</p>
    </div>
  );
}
