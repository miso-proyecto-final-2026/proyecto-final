import { ESTADOS_KYC, ESTADOS_COTIZACION } from './estadoInicial';

/**
 * Lógica derivada del estado.
 *
 * Las pantallas usan estos selectores en vez de recalcular condiciones.
 * Si una condición aparece en dos pantallas, va aquí.
 */

/** Locale para Intl: combina idioma (i18n) y región (l10n). */
export const localeActivo = (estado) =>
  `${estado.preferencias.idioma}-${estado.preferencias.region}`;

export const kycAprobado = (estado) =>
  estado.usuario.estadoKyc === ESTADOS_KYC.APROBADO;

/** H04 requiere H01 + H02. */
export const puedeActivarBiometria = (estado) =>
  kycAprobado(estado) && !estado.usuario.biometriaActiva;

/** H05 solo tiene sentido si antes ocurrió H04. */
export const puedeEntrarConBiometria = (estado) =>
  estado.usuario.biometriaActiva && !estado.usuario.sesionIniciada;

/** H37 es libre: cotizar no requiere identidad verificada. */
export const puedeCotizar = (estado) => !estado.debug.sinConexion;

// --- Historial de cotizaciones (H37) ---------------------------------------
// VENCIDA no se guarda en el estado: se deriva aqui comparando vigenciaHasta
// con la fecha actual. Solo una cotizacion LISTA puede vencer; una invalidada,
// con error o calculando conserva su estado.

/** Estado efectivo de una cotizacion: LISTA pasa a VENCIDA si ya paso su vigencia. */
const estadoEfectivo = (cotizacion) =>
  cotizacion.estado === ESTADOS_COTIZACION.LISTA &&
  cotizacion.vigenciaHasta &&
  new Date(cotizacion.vigenciaHasta).getTime() < Date.now()
    ? ESTADOS_COTIZACION.VENCIDA
    : cotizacion.estado;

/** La misma cotizacion, con su estado efectivo ya resuelto. */
const conEstadoEfectivo = (cotizacion) => {
  const efectivo = estadoEfectivo(cotizacion);
  return efectivo === cotizacion.estado ? cotizacion : { ...cotizacion, estado: efectivo };
};

/**
 * La cotizacion activa (la que se ve en el resultado y la que se paga), o
 * null. Se devuelve con el estado efectivo resuelto, asi una activa vencida
 * llega como VENCIDA a las pantallas.
 */
export const cotizacionActiva = (estado) => {
  const activa = estado.cotizaciones.find((c) => c.id === estado.cotizacionActivaId);
  return activa ? conEstadoEfectivo(activa) : null;
};

/**
 * Todo el historial con el estado efectivo resuelto. Conserva el orden del
 * arreglo, que ya viene con las mas recientes primero. El calculo es
 * derivado: nada se persiste.
 */
export const cotizacionesOrdenadas = (estado) => estado.cotizaciones.map(conEstadoEfectivo);

/** true si el estado efectivo de la cotizacion es LISTA (no vencida). */
export const cotizacionVigente = (cotizacion) =>
  !!cotizacion && estadoEfectivo(cotizacion) === ESTADOS_COTIZACION.LISTA;

export const totalCotizacionesVigentes = (estado) =>
  estado.cotizaciones.filter(cotizacionVigente).length;

/**
 * Cotizaciones firmes (calculadas CON consentimiento) que siguen vigentes:
 * son exactamente las que revocar el consentimiento invalida (H07).
 */
export const cotizacionesFirmesVigentes = (estado) =>
  estado.cotizaciones.filter((c) => c.personalizada && cotizacionVigente(c));

/**
 * H17 requiere una cotizacion activa vigente y FIRME (una estimada es solo
 * informativa y no se contrata), identidad verificada y conexion.
 */
export const puedeComprar = (estado) => {
  const activa = cotizacionActiva(estado);
  return (
    !!activa &&
    cotizacionVigente(activa) &&
    !activa.estimada &&
    kycAprobado(estado) &&
    !estado.debug.sinConexion
  );
};

/**
 * La cotizacion activa esta vigente pero es estimada: para contratar hace
 * falta autorizar el uso de datos y solicitar una cotizacion NUEVA (autorizar
 * no convierte la estimada en firme).
 */
export const requiereConsentimientoParaComprar = (estado) => {
  const activa = cotizacionActiva(estado);
  return !!activa && cotizacionVigente(activa) && !!activa.estimada;
};

/** H07 · la cotizacion activa quedo invalidada al revocar el consentimiento. */
export const cotizacionInvalidada = (estado) => {
  const activa = cotizacionActiva(estado);
  return !!activa && activa.estado === ESTADOS_COTIZACION.INVALIDADA;
};

/** No hay verificación aprobada todavía (no iniciada, en curso o rechazada). */
export const necesitaVerificacion = (estado) =>
  estado.usuario.estadoKyc !== ESTADOS_KYC.APROBADO;

export const verificacionEnCurso = (estado) =>
  estado.usuario.estadoKyc === ESTADOS_KYC.EN_PROCESO;

export const verificacionRechazada = (estado) =>
  estado.usuario.estadoKyc === ESTADOS_KYC.RECHAZADO;

export const consentimientoVigente = (estado) => estado.consentimiento.otorgado === true;

export const entidadesConectadas = (estado) => estado.consentimiento.entidades;

export const totalEntidadesConectadas = (estado) => estado.consentimiento.entidades.length;

/** Las entidades de la region que todavia NO estan conectadas. */
export const entidadesDisponibles = (estado, entidadesRegion) => {
  const codigosConectados = estado.consentimiento.entidades.map((e) => e.codigo);
  return entidadesRegion.filter((e) => !codigosConectados.includes(e.codigo));
};

/** Pólizas pendientes de firma (H21). */
export const polizasSinFirmar = (estado) => estado.polizas.filter((p) => !p.firmada);

/** Mismo selector que polizasSinFirmar, con el nombre que usan las pantallas nuevas. */
export const polizasPendientesFirma = polizasSinFirmar;

export const notificacionesNoLeidas = (estado) =>
  estado.notificaciones.filter((n) => !n.leida);

/**
 * H35 / H36 · Billetera de pólizas.
 * Sin conexión solo se devuelve la información básica almacenada localmente.
 */
export const polizasParaMostrar = (estado) => {
  if (!estado.debug.sinConexion) return estado.polizas;
  return estado.polizas.map((p) => ({
    id: p.id,
    numero: p.numero,
    tipo: p.tipo,
    coberturas: p.coberturas,
    vigenciaHasta: p.vigenciaHasta,
    firmada: p.firmada,
    // No disponibles sin conexión: certificado descargable y prima actualizada.
    certificado: null,
    prima: null,
    parcial: true,
  }));
};
