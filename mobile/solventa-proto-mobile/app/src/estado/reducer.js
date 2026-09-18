import {
  estadoInicial,
  ESTADOS_KYC,
  ESTADOS_COTIZACION,
  TIPOS_NOTIFICACION,
  DIAS_VIGENCIA_COTIZACION,
} from './estadoInicial';
import { ACCIONES } from './acciones';
import { cotizacionActiva, cotizacionVigente } from './selectores';

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

/** Bloquea una acción y avisa en consola. Útil al generar pantallas. */
function bloquear(estado, motivo) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[estado] Acción bloqueada: ${motivo}`);
  }
  return estado;
}

/** Aplica `fn` a la cotizacion con ese id y deja el resto del historial igual. */
const conCotizacion = (estado, id, fn) => ({
  ...estado,
  cotizaciones: estado.cotizaciones.map((c) => (c.id === id ? fn(c) : c)),
});

/**
 * Cuerpo compartido de "revocar el consentimiento" (H07): lo usan tanto
 * REVOCAR_CONSENTIMIENTO como DESCONECTAR_ENTIDAD cuando se desconecta la
 * ultima entidad conectada. Recorre TODO el historial: las cotizaciones
 * firmes (personalizada) que siguen vigentes quedan invalidadas, con prima,
 * primaBase y coberturas intactas para que se vea que esa oferta existio.
 * Las estimadas, las vencidas y las que estan en otro estado no se tocan.
 */
function revocarConsentimientoEstado(estado) {
  return {
    ...estado,
    consentimiento: {
      otorgado: false,
      entidades: [],
      fechaOtorgamiento: estado.consentimiento.fechaOtorgamiento,
      fechaRevocacion: ahora(),
    },
    cotizaciones: estado.cotizaciones.map((c) =>
      c.personalizada && cotizacionVigente(c)
        ? {
            ...c,
            estado: ESTADOS_COTIZACION.INVALIDADA,
            motivoInvalidacion: 'consentimiento_revocado',
          }
        : c
    ),
  };
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
          sesionIniciada: true, // Registrarse abre sesion; el KYC es un paso aparte.
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
        entidades: [{ ...accion.entidad, fechaConexion: ahora() }],
        fechaOtorgamiento: ahora(),
        fechaRevocacion: null,
      };
      // Las cotizaciones quedan intactas, incluso las invalidadas: otorgar
      // de nuevo NO revive una cotizacion invalidada. Hay que volver a
      // cotizar.
      return {
        ...estado,
        consentimiento,
      };
    }

    // =====================================================================
    // H07 · Revocar consentimiento -> consecuencia VISIBLE sobre la oferta
    // =====================================================================
    case ACCIONES.REVOCAR_CONSENTIMIENTO: {
      if (!estado.consentimiento.otorgado) {
        return bloquear(estado, 'H07 requiere H06: no hay consentimiento vigente.');
      }
      return revocarConsentimientoEstado(estado);
    }

    // Conectar una entidad adicional (varias fuentes -> oferta mas precisa).
    // No toca ninguna cotizacion: sumar una fuente no las invalida.
    case ACCIONES.CONECTAR_ENTIDAD: {
      if (!estado.consentimiento.otorgado) {
        return bloquear(estado, 'CONECTAR_ENTIDAD requiere consentimiento vigente (H06).');
      }
      const yaConectada = estado.consentimiento.entidades.some(
        (e) => e.codigo === accion.entidad.codigo
      );
      if (yaConectada) return estado;
      return {
        ...estado,
        consentimiento: {
          ...estado.consentimiento,
          entidades: [
            ...estado.consentimiento.entidades,
            { ...accion.entidad, fechaConexion: ahora() },
          ],
        },
      };
    }

    // Desconectar una entidad. Si era la ultima, equivale a revocar el
    // consentimiento completo (mismo cuerpo que REVOCAR_CONSENTIMIENTO).
    case ACCIONES.DESCONECTAR_ENTIDAD: {
      const restantes = estado.consentimiento.entidades.filter(
        (e) => e.codigo !== accion.codigo
      );
      if (restantes.length === 0) {
        return revocarConsentimientoEstado(estado);
      }
      return {
        ...estado,
        consentimiento: { ...estado.consentimiento, entidades: restantes },
      };
    }

    // =====================================================================
    // H37 · Solicitar cotización desde el móvil
    // =====================================================================
    case ACCIONES.SOLICITAR_COTIZACION: {
      // Cotizar es libre: no requiere identidad verificada. Solo comprar
      // (H17, mas abajo) la exige. Cada solicitud AGREGA una cotizacion al
      // historial (la mas reciente primero) y la deja como activa: nunca
      // reemplaza ni borra las anteriores.
      const creada = new Date();
      const vigenciaHasta = new Date(creada);
      vigenciaHasta.setDate(vigenciaHasta.getDate() + DIAS_VIGENCIA_COTIZACION);
      const cotizacion = {
        id: nuevoId('cot'),
        tipoSeguro: accion.tipoSeguro,
        parametros: accion.parametros,
        primaBase: null,
        prima: null,
        moneda: null,
        coberturas: [],
        personalizada: estado.consentimiento.otorgado,
        estimada: !estado.consentimiento.otorgado,
        estado: ESTADOS_COTIZACION.CALCULANDO,
        motivoError: null,
        motivoInvalidacion: null,
        fechaCreacion: creada.toISOString(),
        vigenciaHasta: vigenciaHasta.toISOString(),
      };
      return {
        ...estado,
        cotizaciones: [cotizacion, ...estado.cotizaciones],
        cotizacionActivaId: cotizacion.id,
      };
    }

    case ACCIONES.RECIBIR_COTIZACION: {
      if (!estado.cotizacionActivaId) return estado;
      return conCotizacion(estado, estado.cotizacionActivaId, (c) => ({
        ...c,
        primaBase: accion.resultado.primaBase,
        prima: accion.resultado.primaBase,
        moneda: accion.resultado.moneda,
        coberturas: accion.resultado.coberturas,
        estado: ESTADOS_COTIZACION.LISTA,
      }));
    }

    case ACCIONES.FALLAR_COTIZACION: {
      if (!estado.cotizacionActivaId) return estado;
      return conCotizacion(estado, estado.cotizacionActivaId, (c) => ({
        ...c,
        estado: ESTADOS_COTIZACION.ERROR,
        motivoError: accion.motivo,
      }));
    }

    // Ya no borra: solo deja de haber una cotizacion activa. El historial queda.
    case ACCIONES.DESCARTAR_COTIZACION:
      return { ...estado, cotizacionActivaId: null };

    case ACCIONES.SELECCIONAR_COTIZACION:
      if (!estado.cotizaciones.some((c) => c.id === accion.id)) {
        return bloquear(estado, `SELECCIONAR_COTIZACION: no existe la cotización "${accion.id}".`);
      }
      return { ...estado, cotizacionActivaId: accion.id };

    case ACCIONES.ELIMINAR_COTIZACION:
      return {
        ...estado,
        cotizaciones: estado.cotizaciones.filter((c) => c.id !== accion.id),
        cotizacionActivaId:
          estado.cotizacionActivaId === accion.id ? null : estado.cotizacionActivaId,
      };

    // =====================================================================
    // H17 · Aceptar la oferta y confirmar el pago
    // =====================================================================
    case ACCIONES.CONFIRMAR_PAGO: {
      // Opera sobre la cotizacion ACTIVA. cotizacionActiva() la devuelve con
      // el estado efectivo resuelto, asi una lista pero vencida llega como
      // VENCIDA. Los chequeos especificos van antes que el generico de
      // "lista", para que el motivo del bloqueo diga la causa real.
      const cot = cotizacionActiva(estado);
      if (cot && cot.estado === ESTADOS_COTIZACION.INVALIDADA) {
        return bloquear(
          estado,
          'H17 bloqueado: la cotización fue invalidada al revocar el consentimiento.'
        );
      }
      if (cot && cot.estado === ESTADOS_COTIZACION.VENCIDA) {
        return bloquear(estado, 'H17 bloqueado: la cotización está vencida.');
      }
      if (!cot || cot.estado !== ESTADOS_COTIZACION.LISTA) {
        return bloquear(estado, 'H17 requiere una cotización lista (H37).');
      }
      if (cot.estimada) {
        return bloquear(estado, 'H17 bloqueado: una cotizacion estimada no puede contratarse.');
      }
      if (estado.usuario.estadoKyc !== ESTADOS_KYC.APROBADO) {
        return bloquear(estado, 'H17 requiere identidad verificada (H02).');
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
      // La cotizacion se consumio al contratar: sale del historial.
      return {
        ...estado,
        polizas: [...estado.polizas, poliza],
        cotizaciones: estado.cotizaciones.filter((c) => c.id !== cot.id),
        cotizacionActivaId: null,
      };
    }

    // Un pago fallido NO toca la cotizacion: sigue LISTA, activa y en el
    // historial, y se puede reintentar. Solo deja de servir cuando vence
    // (VENCIDA, derivado) o se invalida por revocar el consentimiento. El
    // fallo lo muestra la pantalla de pago con el motivo que recibio; el
    // estado del negocio no cambia. El caso existe para que la accion no caiga
    // en el "accion desconocida" del default.
    case ACCIONES.FALLAR_PAGO:
      return estado;

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
    // catálogo. Por eso descarta todas las cotizaciones y limpia el documento.
    case ACCIONES.CAMBIAR_REGION:
      if (accion.region === estado.preferencias.region) return estado;
      return {
        ...estado,
        preferencias: { ...estado.preferencias, region: accion.region },
        usuario: { ...estado.usuario, documento: '' },
        cotizaciones: [],
        cotizacionActivaId: null,
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
