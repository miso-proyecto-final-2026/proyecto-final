import {
  estadoInicial,
  ESTADOS_KYC,
  ESTADOS_COTIZACION,
  TIPOS_NOTIFICACION,
  RECARGO_SIN_CONSENTIMIENTO,
} from './estadoInicial';
import { ACCIONES } from './acciones';

/**
 * Reducer único del prototipo.
 *
 * Aquí viven TODAS las reglas de coherencia entre historias. Las pantallas
 * solo despachan acciones; nunca deciden por su cuenta si algo se permite.
 *
 * Nota: el reducer usa Date.now() y un contador para generar ids y fechas.
 * No es estrictamente puro, pero es una simplificación deliberada de
 * prototipo: mantiene los creadores de acción simples.
 */

let contador = 0;
const nuevoId = (prefijo) => `${prefijo}_${Date.now()}_${++contador}`;
const ahora = () => new Date().toISOString();

/** Aplica el recargo cuando no hay consentimiento (regla H06 <-> H07 <-> H37). */
function recalcularPrima(cotizacion, hayConsentimiento) {
  if (!cotizacion || cotizacion.primaBase == null) return cotizacion;
  return {
    ...cotizacion,
    personalizada: hayConsentimiento,
    prima: hayConsentimiento
      ? cotizacion.primaBase
      : Math.round(cotizacion.primaBase * RECARGO_SIN_CONSENTIMIENTO),
  };
}

/** Bloquea una acción y avisa en consola. Útil al generar pantallas. */
function bloquear(estado, motivo) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[estado] Acción bloqueada: ${motivo}`);
  }
  return estado;
}

export function reducer(estado, accion) {
  switch (accion.type) {
    // =====================================================================
    // H01 · Registro
    // =====================================================================
    case ACCIONES.REGISTRAR_USUARIO:
      return {
        ...estado,
        usuario: {
          ...estado.usuario,
          ...accion.datos,
          estadoKyc: ESTADOS_KYC.NO_INICIADO,
        },
      };

    // =====================================================================
    // H02 · Verificación de identidad (selfie + documento)
    // =====================================================================
    case ACCIONES.INICIAR_KYC:
      if (!estado.usuario.documento) {
        return bloquear(estado, 'H02 requiere H01: no hay datos de registro.');
      }
      return {
        ...estado,
        usuario: {
          ...estado.usuario,
          estadoKyc: ESTADOS_KYC.EN_PROCESO,
          motivoRechazoKyc: null,
        },
      };

    // =====================================================================
    // H03 · Resultado claro de la verificación (aprobada o rechazada)
    // =====================================================================
    case ACCIONES.RESOLVER_KYC:
      return {
        ...estado,
        usuario: {
          ...estado.usuario,
          estadoKyc: accion.aprobado ? ESTADOS_KYC.APROBADO : ESTADOS_KYC.RECHAZADO,
          motivoRechazoKyc: accion.aprobado ? null : accion.motivo,
          sesionIniciada: accion.aprobado ? true : estado.usuario.sesionIniciada,
        },
      };

    case ACCIONES.REINTENTAR_KYC:
      return {
        ...estado,
        usuario: {
          ...estado.usuario,
          estadoKyc: ESTADOS_KYC.NO_INICIADO,
          motivoRechazoKyc: null,
        },
      };

    // =====================================================================
    // H04 · Activar acceso biométrico  (requiere H01 + H02)
    // =====================================================================
    case ACCIONES.ACTIVAR_BIOMETRIA:
      if (estado.usuario.estadoKyc !== ESTADOS_KYC.APROBADO) {
        return bloquear(estado, 'H04 requiere KYC aprobado (H02).');
      }
      return {
        ...estado,
        usuario: { ...estado.usuario, biometriaActiva: true },
      };

    case ACCIONES.DESACTIVAR_BIOMETRIA:
      return {
        ...estado,
        usuario: { ...estado.usuario, biometriaActiva: false },
      };

    // =====================================================================
    // H05 · Iniciar sesión con biometría
    // =====================================================================
    case ACCIONES.INICIAR_SESION:
      return {
        ...estado,
        usuario: { ...estado.usuario, sesionIniciada: true },
      };

    case ACCIONES.CERRAR_SESION:
      return {
        ...estado,
        usuario: { ...estado.usuario, sesionIniciada: false },
      };

    // =====================================================================
    // H06 · Otorgar consentimiento Open Finance / Open Data
    // =====================================================================
    case ACCIONES.OTORGAR_CONSENTIMIENTO: {
      const consentimiento = {
        otorgado: true,
        fechaOtorgamiento: ahora(),
        fechaRevocacion: null,
      };
      return {
        ...estado,
        consentimiento,
        // Si ya había una cotización, se vuelve personalizada y baja la prima.
        cotizacion: recalcularPrima(estado.cotizacion, true),
      };
    }

    // =====================================================================
    // H07 · Revocar consentimiento -> consecuencia VISIBLE sobre la oferta
    // =====================================================================
    case ACCIONES.REVOCAR_CONSENTIMIENTO: {
      if (!estado.consentimiento.otorgado) {
        return bloquear(estado, 'H07 requiere H06: no hay consentimiento vigente.');
      }
      return {
        ...estado,
        consentimiento: {
          otorgado: false,
          fechaOtorgamiento: estado.consentimiento.fechaOtorgamiento,
          fechaRevocacion: ahora(),
        },
        cotizacion: recalcularPrima(estado.cotizacion, false),
      };
    }

    // =====================================================================
    // H37 · Solicitar cotización desde el móvil
    // =====================================================================
    case ACCIONES.SOLICITAR_COTIZACION:
      if (estado.usuario.estadoKyc !== ESTADOS_KYC.APROBADO) {
        return bloquear(estado, 'H37 requiere KYC aprobado.');
      }
      return {
        ...estado,
        cotizacion: {
          id: nuevoId('cot'),
          tipoSeguro: accion.tipoSeguro,
          parametros: accion.parametros,
          primaBase: null,
          prima: null,
          moneda: null,
          coberturas: [],
          personalizada: estado.consentimiento.otorgado,
          estado: ESTADOS_COTIZACION.CALCULANDO,
          motivoError: null,
        },
      };

    case ACCIONES.RECIBIR_COTIZACION: {
      if (!estado.cotizacion) return estado;
      const base = {
        ...estado.cotizacion,
        primaBase: accion.resultado.primaBase,
        moneda: accion.resultado.moneda,
        coberturas: accion.resultado.coberturas,
        estado: ESTADOS_COTIZACION.LISTA,
      };
      return {
        ...estado,
        cotizacion: recalcularPrima(base, estado.consentimiento.otorgado),
      };
    }

    case ACCIONES.FALLAR_COTIZACION:
      if (!estado.cotizacion) return estado;
      return {
        ...estado,
        cotizacion: {
          ...estado.cotizacion,
          estado: ESTADOS_COTIZACION.ERROR,
          motivoError: accion.motivo,
        },
      };

    case ACCIONES.DESCARTAR_COTIZACION:
      return { ...estado, cotizacion: null };

    // =====================================================================
    // H17 · Aceptar la oferta y confirmar el pago
    // =====================================================================
    case ACCIONES.CONFIRMAR_PAGO: {
      const cot = estado.cotizacion;
      if (!cot || cot.estado !== ESTADOS_COTIZACION.LISTA) {
        return bloquear(estado, 'H17 requiere una cotización lista (H37).');
      }
      const poliza = {
        id: nuevoId('pol'),
        numero: `SOL-${String(estado.polizas.length + 1).padStart(6, '0')}`,
        tipo: cot.tipoSeguro,
        prima: cot.prima,
        moneda: cot.moneda,
        coberturas: cot.coberturas,
        firmada: false, // H21 todavía no ocurre
        certificado: null, // H22 todavía no ocurre
        vigenciaDesde: ahora(),
        vigenciaHasta: null,
      };
      return {
        ...estado,
        polizas: [...estado.polizas, poliza],
        cotizacion: null,
      };
    }

    case ACCIONES.FALLAR_PAGO:
      if (!estado.cotizacion) return estado;
      return {
        ...estado,
        cotizacion: {
          ...estado.cotizacion,
          estado: ESTADOS_COTIZACION.ERROR,
          motivoError: accion.motivo,
        },
      };

    // =====================================================================
    // H21 · Firma electrónica de la póliza
    // =====================================================================
    case ACCIONES.FIRMAR_POLIZA:
      return {
        ...estado,
        polizas: estado.polizas.map((p) =>
          p.id === accion.idPoliza ? { ...p, firmada: true } : p
        ),
      };

    // =====================================================================
    // H22 · Certificado emitido + notificación de confirmación
    // =====================================================================
    case ACCIONES.EMITIR_CERTIFICADO: {
      const poliza = estado.polizas.find((p) => p.id === accion.idPoliza);
      if (!poliza) return estado;
      if (!poliza.firmada) {
        return bloquear(estado, 'H22 requiere H21: la póliza no está firmada.');
      }
      const vigenciaHasta = new Date();
      vigenciaHasta.setFullYear(vigenciaHasta.getFullYear() + 1);

      return {
        ...estado,
        polizas: estado.polizas.map((p) =>
          p.id === accion.idPoliza
            ? {
                ...p,
                certificado: `CERT-${p.numero}`,
                vigenciaHasta: vigenciaHasta.toISOString(),
              }
            : p
        ),
        notificaciones: [
          {
            id: nuevoId('not'),
            tipo: TIPOS_NOTIFICACION.CERTIFICADO,
            tituloClave: 'notificaciones.certificado.titulo',
            cuerpoClave: 'notificaciones.certificado.cuerpo',
            datos: { numero: poliza.numero },
            fecha: ahora(),
            leida: false,
          },
          ...estado.notificaciones,
        ],
      };
    }

    // =====================================================================
    // H30 · Pago paramétrico ejecutado -> notificación push
    // =====================================================================
    case ACCIONES.RECIBIR_PAGO_PARAMETRICO: {
      const poliza = estado.polizas.find((p) => p.id === accion.idPoliza);
      return {
        ...estado,
        notificaciones: [
          {
            id: nuevoId('not'),
            tipo: TIPOS_NOTIFICACION.PAGO_PARAMETRICO,
            tituloClave: 'notificaciones.pagoParametrico.titulo',
            cuerpoClave: 'notificaciones.pagoParametrico.cuerpo',
            datos: {
              monto: accion.monto,
              moneda: poliza ? poliza.moneda : null,
              evento: accion.evento,
              numero: poliza ? poliza.numero : null,
            },
            fecha: ahora(),
            leida: false,
          },
          ...estado.notificaciones,
        ],
      };
    }

    case ACCIONES.MARCAR_NOTIFICACION_LEIDA:
      return {
        ...estado,
        notificaciones: estado.notificaciones.map((n) =>
          n.id === accion.idNotificacion ? { ...n, leida: true } : n
        ),
      };

    // =====================================================================
    // Preferencias · idioma (i18n) vs región (l10n)
    // =====================================================================

    // Cambiar idioma NO toca el negocio. Solo cambia los textos.
    case ACCIONES.CAMBIAR_IDIOMA:
      return {
        ...estado,
        preferencias: { ...estado.preferencias, idioma: accion.idioma },
      };

    // Cambiar región SÍ toca el negocio: cambia moneda, tipo de documento y
    // catálogo. Por eso invalida la cotización y limpia el documento.
    case ACCIONES.CAMBIAR_REGION:
      if (accion.region === estado.preferencias.region) return estado;
      return {
        ...estado,
        preferencias: { ...estado.preferencias, region: accion.region },
        usuario: { ...estado.usuario, documento: '' },
        cotizacion: null,
      };

    case ACCIONES.CAMBIAR_TAMANO_TEXTO:
      return {
        ...estado,
        preferencias: { ...estado.preferencias, tamanoTexto: accion.tamano },
      };

    // =====================================================================
    // Panel de depuración
    // =====================================================================
    case ACCIONES.ALTERNAR_DEBUG:
      return {
        ...estado,
        debug: { ...estado.debug, [accion.bandera]: !estado.debug[accion.bandera] },
      };

    case ACCIONES.ESTABLECER_DEBUG:
      return {
        ...estado,
        debug: { ...estado.debug, [accion.bandera]: accion.valor },
      };

    // Reinicia el negocio para el siguiente usuario de prueba, pero conserva
    // las preferencias y la configuración del panel de depuración.
    case ACCIONES.REINICIAR_SESION_PRUEBA:
      return {
        ...estadoInicial,
        preferencias: estado.preferencias,
        debug: estado.debug,
      };

    default:
      return bloquear(estado, `acción desconocida "${accion.type}"`);
  }
}

export default reducer;
