/**
 * Nombres de acción y creadores de acción.
 *
 * IMPORTANTE: las pantallas NUNCA deben escribir el string de la acción a mano.
 * Siempre importan desde aquí. Es lo que mantiene coherentes las 15 pantallas.
 */

export const ACCIONES = {
  // Registro y verificación de identidad (H01, H02, H03)
  REGISTRAR_USUARIO: 'REGISTRAR_USUARIO',
  INICIAR_KYC: 'INICIAR_KYC',
  RESOLVER_KYC: 'RESOLVER_KYC',
  REINTENTAR_KYC: 'REINTENTAR_KYC',

  // Biometría y sesión (H04, H05)
  ACTIVAR_BIOMETRIA: 'ACTIVAR_BIOMETRIA',
  DESACTIVAR_BIOMETRIA: 'DESACTIVAR_BIOMETRIA',
  INICIAR_SESION: 'INICIAR_SESION',
  CERRAR_SESION: 'CERRAR_SESION',

  // Consentimiento Open Finance (H06, H07)
  OTORGAR_CONSENTIMIENTO: 'OTORGAR_CONSENTIMIENTO',
  REVOCAR_CONSENTIMIENTO: 'REVOCAR_CONSENTIMIENTO',
  CONECTAR_ENTIDAD: 'CONECTAR_ENTIDAD',
  DESCONECTAR_ENTIDAD: 'DESCONECTAR_ENTIDAD',

  // Cotización (H37)
  SOLICITAR_COTIZACION: 'SOLICITAR_COTIZACION',
  RECIBIR_COTIZACION: 'RECIBIR_COTIZACION',
  FALLAR_COTIZACION: 'FALLAR_COTIZACION',
  DESCARTAR_COTIZACION: 'DESCARTAR_COTIZACION',

  // Compra, firma y certificado (H17, H21, H22)
  CONFIRMAR_PAGO: 'CONFIRMAR_PAGO',
  FALLAR_PAGO: 'FALLAR_PAGO',
  FIRMAR_POLIZA: 'FIRMAR_POLIZA',
  EMITIR_CERTIFICADO: 'EMITIR_CERTIFICADO',

  // Siniestro paramétrico (H30)
  RECIBIR_PAGO_PARAMETRICO: 'RECIBIR_PAGO_PARAMETRICO',
  MARCAR_NOTIFICACION_LEIDA: 'MARCAR_NOTIFICACION_LEIDA',

  // Preferencias (i18n / l10n / accesibilidad)
  CAMBIAR_IDIOMA: 'CAMBIAR_IDIOMA',
  CAMBIAR_REGION: 'CAMBIAR_REGION',
  CAMBIAR_TAMANO_TEXTO: 'CAMBIAR_TAMANO_TEXTO',

  // Panel de depuración
  ALTERNAR_DEBUG: 'ALTERNAR_DEBUG',
  ESTABLECER_DEBUG: 'ESTABLECER_DEBUG',
  REINICIAR_SESION_PRUEBA: 'REINICIAR_SESION_PRUEBA',
};

// --- Creadores de acción ---------------------------------------------------

export const registrarUsuario = (datos) => ({
  type: ACCIONES.REGISTRAR_USUARIO,
  datos, // { nombre, apellido, email, telefono, documento }
});

export const iniciarKyc = () => ({ type: ACCIONES.INICIAR_KYC });

export const resolverKyc = (aprobado, motivo = null) => ({
  type: ACCIONES.RESOLVER_KYC,
  aprobado,
  motivo,
});

export const reintentarKyc = () => ({ type: ACCIONES.REINTENTAR_KYC });

export const activarBiometria = () => ({ type: ACCIONES.ACTIVAR_BIOMETRIA });
export const desactivarBiometria = () => ({ type: ACCIONES.DESACTIVAR_BIOMETRIA });
export const iniciarSesion = () => ({ type: ACCIONES.INICIAR_SESION });
export const cerrarSesion = () => ({ type: ACCIONES.CERRAR_SESION });

export const otorgarConsentimiento = (entidad) => ({
  type: ACCIONES.OTORGAR_CONSENTIMIENTO,
  entidad, // { codigo, nombre }
});
export const revocarConsentimiento = () => ({ type: ACCIONES.REVOCAR_CONSENTIMIENTO });

export const conectarEntidad = (entidad) => ({
  type: ACCIONES.CONECTAR_ENTIDAD,
  entidad, // { codigo, nombre }
});
export const desconectarEntidad = (codigo) => ({
  type: ACCIONES.DESCONECTAR_ENTIDAD,
  codigo,
});

export const solicitarCotizacion = (tipoSeguro, parametros) => ({
  type: ACCIONES.SOLICITAR_COTIZACION,
  tipoSeguro,
  parametros,
});

export const recibirCotizacion = (resultado) => ({
  type: ACCIONES.RECIBIR_COTIZACION,
  resultado, // { primaBase, moneda, coberturas }
});

export const fallarCotizacion = (motivo) => ({
  type: ACCIONES.FALLAR_COTIZACION,
  motivo,
});

export const descartarCotizacion = () => ({ type: ACCIONES.DESCARTAR_COTIZACION });

export const confirmarPago = () => ({ type: ACCIONES.CONFIRMAR_PAGO });
export const fallarPago = (motivo) => ({ type: ACCIONES.FALLAR_PAGO, motivo });
export const firmarPoliza = (idPoliza) => ({ type: ACCIONES.FIRMAR_POLIZA, idPoliza });
export const emitirCertificado = (idPoliza) => ({
  type: ACCIONES.EMITIR_CERTIFICADO,
  idPoliza,
});

export const recibirPagoParametrico = (idPoliza, monto, evento) => ({
  type: ACCIONES.RECIBIR_PAGO_PARAMETRICO,
  idPoliza,
  monto,
  evento, // 'retraso_vuelo' | 'evento_climatico'
});

export const marcarNotificacionLeida = (idNotificacion) => ({
  type: ACCIONES.MARCAR_NOTIFICACION_LEIDA,
  idNotificacion,
});

export const cambiarIdioma = (idioma) => ({ type: ACCIONES.CAMBIAR_IDIOMA, idioma });
export const cambiarRegion = (region) => ({ type: ACCIONES.CAMBIAR_REGION, region });
export const cambiarTamanoTexto = (tamano) => ({
  type: ACCIONES.CAMBIAR_TAMANO_TEXTO,
  tamano,
});

export const alternarDebug = (bandera) => ({ type: ACCIONES.ALTERNAR_DEBUG, bandera });
export const establecerDebug = (bandera, valor) => ({
  type: ACCIONES.ESTABLECER_DEBUG,
  bandera,
  valor,
});
export const reiniciarSesionPrueba = () => ({ type: ACCIONES.REINICIAR_SESION_PRUEBA });
