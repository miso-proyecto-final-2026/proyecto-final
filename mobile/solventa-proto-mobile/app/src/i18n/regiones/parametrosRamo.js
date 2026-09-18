/**
 * Parametros de cotizacion por ramo (H37).
 *
 * Datos puros, sin React: la pantalla Cotizacion dibuja el formulario a
 * partir de PARAMETROS_RAMO y el servicio falso calcula la prima con
 * factorPrima. Los ramos son los mismos que las claves del catalogo de cada
 * region (viaje, dispositivos, vida, desempleo).
 *
 * Tipos de parametro:
 *  - 'numero'   campo numerico con min/max opcionales.
 *  - 'moneda'   campo numerico; la moneda sale de la region activa.
 *  - 'selector' lista cerrada de `opciones`; el texto visible de cada una
 *               vive en i18n: cotizacion.opciones.<nombre>.<opcion>.
 */

/**
 * @typedef {object} ParametroRamo
 * @property {string} nombre
 * @property {'numero' | 'selector' | 'moneda'} tipo
 * @property {string} claveEtiqueta
 * @property {string[]} [opciones]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [porDefecto]
 */

/** @type {Record<string, ParametroRamo[]>} */
export const PARAMETROS_RAMO = {
  viaje: [
    {
      nombre: 'destino',
      tipo: 'selector',
      claveEtiqueta: 'cotizacion.campos.destino',
      opciones: ['europa', 'norteamerica', 'suramerica', 'asia'],
    },
    {
      nombre: 'dias',
      tipo: 'numero',
      claveEtiqueta: 'cotizacion.campos.dias',
      min: 1,
      max: 90,
      porDefecto: 10,
    },
    {
      nombre: 'viajeros',
      tipo: 'numero',
      claveEtiqueta: 'cotizacion.campos.viajeros',
      min: 1,
      max: 8,
      porDefecto: 1,
    },
  ],
  dispositivos: [
    {
      nombre: 'tipoDispositivo',
      tipo: 'selector',
      claveEtiqueta: 'cotizacion.campos.tipoDispositivo',
      opciones: ['celular', 'portatil', 'tableta'],
    },
    {
      nombre: 'valorEquipo',
      tipo: 'moneda',
      claveEtiqueta: 'cotizacion.campos.valorEquipo',
    },
    {
      nombre: 'antiguedadMeses',
      tipo: 'numero',
      claveEtiqueta: 'cotizacion.campos.antiguedadMeses',
      min: 0,
      max: 60,
      porDefecto: 6,
    },
  ],
  vida: [
    {
      nombre: 'montoAsegurado',
      tipo: 'moneda',
      claveEtiqueta: 'cotizacion.campos.montoAsegurado',
    },
    {
      nombre: 'plazoAnios',
      tipo: 'selector',
      claveEtiqueta: 'cotizacion.campos.plazoAnios',
      opciones: ['1', '5', '10'],
    },
  ],
  desempleo: [
    {
      nombre: 'ingresoMensual',
      tipo: 'moneda',
      claveEtiqueta: 'cotizacion.campos.ingresoMensual',
    },
    {
      nombre: 'cuotasCubiertas',
      tipo: 'selector',
      claveEtiqueta: 'cotizacion.campos.cuotasCubiertas',
      opciones: ['3', '6', '12'],
    },
  ],
};

/**
 * Coberturas incluidas por ramo. Cada clave tiene su texto en i18n:
 * coberturas.<clave>.
 *
 * @type {Record<string, string[]>}
 */
export const COBERTURAS_RAMO = {
  viaje: ['cancelacion', 'asistencia_medica', 'equipaje', 'demora'],
  dispositivos: ['robo', 'dano_accidental', 'dano_liquidos', 'pantalla_rota'],
  vida: ['muerte_natural', 'muerte_accidental', 'invalidez_total'],
  desempleo: ['pago_cuotas', 'asesoria_laboral', 'gastos_basicos'],
};

const FACTOR_MIN = 0.5;
const FACTOR_MAX = 5;

const acotar = (valor) => Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, valor));

/** Numero finito o null: los campos vacios o no numericos no aportan nada. */
const comoNumero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

/**
 * Multiplicador determinista de la prima base segun los parametros.
 * Siempre queda entre 0.5 y 5. No hay validacion en el formulario, asi que
 * los valores ausentes o invalidos caen a un valor neutro (1).
 */
export function factorPrima(ramo, parametros = {}) {
  switch (ramo) {
    case 'viaje': {
      const dias = comoNumero(parametros.dias) ?? 10;
      const viajeros = comoNumero(parametros.viajeros) ?? 1;
      return acotar((dias / 10) * viajeros);
    }
    case 'dispositivos': {
      const valor = comoNumero(parametros.valorEquipo);
      return acotar(valor ? valor / 2000000 : 1);
    }
    case 'vida': {
      const plazo = comoNumero(parametros.plazoAnios) ?? 5;
      return acotar(plazo / 5);
    }
    case 'desempleo': {
      const cuotas = comoNumero(parametros.cuotasCubiertas) ?? 6;
      return acotar(cuotas / 6);
    }
    default:
      return 1;
  }
}
