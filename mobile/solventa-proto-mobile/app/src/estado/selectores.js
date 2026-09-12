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

/** H37 requiere identidad verificada. */
export const puedeCotizar = (estado) =>
  kycAprobado(estado) && !estado.debug.sinConexion;

/** H17 requiere una cotización lista. */
export const puedeComprar = (estado) =>
  !!estado.cotizacion &&
  estado.cotizacion.estado === ESTADOS_COTIZACION.LISTA &&
  !estado.debug.sinConexion;

/** Pólizas pendientes de firma (H21). */
export const polizasSinFirmar = (estado) => estado.polizas.filter((p) => !p.firmada);

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
