/**
 * Estado inicial del prototipo Solventa (móvil).
 *
 * Este objeto es el "backend" del prototipo: no hay servidor, así que aquí
 * vive tanto lo que el usuario escribe como lo que el backend habría
 * respondido (prima, coberturas, certificado...).
 */

/** Estados posibles del proceso de verificación de identidad (H02, H03). */
export const ESTADOS_KYC = {
  NO_INICIADO: 'no_iniciado',
  EN_PROCESO: 'en_proceso',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
};

/** Estados posibles de una cotización (H37). */
export const ESTADOS_COTIZACION = {
  CALCULANDO: 'calculando',
  LISTA: 'lista',
  ERROR: 'error',
  INVALIDADA: 'invalidada',
  // Derivado: una cotizacion LISTA cuya vigenciaHasta ya paso. Nunca se
  // guarda en el estado; lo resuelven los selectores (ver selectores.js).
  VENCIDA: 'vencida',
};

/** Dias que dura vigente una cotizacion desde que se crea. */
export const DIAS_VIGENCIA_COTIZACION = 15;

/** Tipos de notificación (H22, H30). */
export const TIPOS_NOTIFICACION = {
  CERTIFICADO: 'certificado',
  PAGO_PARAMETRICO: 'pago_parametrico',
};

export const IDIOMAS = ['es', 'en'];
export const REGIONES = ['CO', 'MX'];

export const estadoInicial = {
  // --- H01, H02, H03, H04, H05 -------------------------------------------
  usuario: {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    documento: '',
    fechaNacimiento: '',
    tipoDocumento: '', // 'CC' | 'CE' | 'PA' | 'CURP' | 'INE'
    direccion1: '',
    direccion2: '',
    ciudad: '',
    terminosAceptados: false,
    estadoKyc: ESTADOS_KYC.NO_INICIADO,
    motivoRechazoKyc: null,
    biometriaActiva: false,
    sesionIniciada: false,
  },

  // --- H06, H07 -----------------------------------------------------------
  consentimiento: {
    otorgado: false,
    entidades: [], // [{ codigo, nombre, fechaConexion }]
    fechaOtorgamiento: null,
    fechaRevocacion: null,
  },

  // --- H37 ----------------------------------------------------------------
  // Historial de cotizaciones, las mas recientes primero. Cada una:
  // { id, tipoSeguro, parametros, primaBase, prima, moneda, coberturas: [],
  //   personalizada, estimada, estado, motivoError, motivoInvalidacion,
  //   fechaCreacion, vigenciaHasta }
  cotizaciones: [],
  // Id de la cotizacion sobre la que se esta trabajando (la que se ve en el
  // resultado y la que se paga), o null.
  cotizacionActivaId: null,

  // --- H17, H21, H22, H35, H36 -------------------------------------------
  // { id, numero, tipo, prima, moneda, coberturas: [],
  //   firmada, certificado, vigenciaDesde, vigenciaHasta }
  polizas: [],

  // --- H22, H30 -----------------------------------------------------------
  // { id, tipo, tituloClave, cuerpoClave, datos, fecha, leida }
  notificaciones: [],

  // --- i18n / l10n / accesibilidad ---------------------------------------
  preferencias: {
    idioma: 'es', // es | en   -> solo afecta TEXTOS
    region: 'CO', // CO | MX   -> afecta MONEDA, DOCUMENTO, CATÁLOGO
    tamanoTexto: 'normal', // normal | grande
  },

  // --- Panel de depuración (no es negocio, es control de la sesión) -------
  debug: {
    sinConexion: false, // H36
    forzarFalloKyc: false, // H03 rama de rechazo
    forzarFalloPago: false, // H17 rama de fallo
    textosLargos: false, // pseudo-localización
    latenciaMs: 1200,
  },
};

export default estadoInicial;
