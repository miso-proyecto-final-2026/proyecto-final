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

/** H17 requiere una cotización lista (no invalidada) Y identidad verificada. */
export const puedeComprar = (estado) =>
  !!estado.cotizacion &&
  estado.cotizacion.estado === ESTADOS_COTIZACION.LISTA &&
  estado.cotizacion.estado !== ESTADOS_COTIZACION.INVALIDADA &&
  !estado.debug.sinConexion &&
  kycAprobado(estado);

/** H07 · la cotizacion vigente quedo invalidada al revocar el consentimiento. */
export const cotizacionInvalidada = (estado) =>
  !!estado.cotizacion && estado.cotizacion.estado === ESTADOS_COTIZACION.INVALIDADA;

// TODO: cuando exista la pantalla de Cotizacion, debe mostrar el estado
// INVALIDADA con su propia marca visual (no solo bloquear la compra).

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
