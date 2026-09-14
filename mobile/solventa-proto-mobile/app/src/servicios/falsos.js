/**
 * Servicios falsos del prototipo Solventa (movil).
 *
 * Sin backend real: cada funcion es async, recibe el objeto `debug` del
 * estado como primer argumento, espera debug.latenciaMs y resuelve con
 * { ok: true, datos } o { ok: false, motivo }. Las banderas debug.forzarFalloX
 * deciden el resultado, nunca la aleatoriedad. Ningun servicio despacha
 * acciones: la pantalla recibe el resultado y decide que despachar.
 */

/** Promesa que se resuelve tras `ms` milisegundos. */
export function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simula el ingreso con credenciales.
 *
 * No recibe credenciales ni las verifica: el ingreso con credenciales no
 * corresponde a ninguna historia de usuario en este prototipo, asi que
 * siempre resuelve con exito tras la latencia simulada. Es intencional.
 */
export async function autenticar(debug) {
  await esperar(debug.latenciaMs);
  return { ok: true };
}

/**
 * Simula la verificacion de identidad (H02): documento + selfie.
 *
 * Es a proposito el paso mas lento del flujo: espera el doble de
 * debug.latenciaMs. debug.sinConexion simula una falla de red (se puede
 * reintentar sin perder el KYC); debug.forzarFalloKyc simula un documento
 * ilegible (falla real del KYC).
 */
export async function verificarIdentidad(debug) {
  await esperar(debug.latenciaMs * 2);
  if (debug.sinConexion) return { ok: false, motivo: 'sin_conexion' };
  if (debug.forzarFalloKyc) return { ok: false, motivo: 'documento_ilegible' };
  return { ok: true };
}

/**
 * Simula la conexion con Open Finance (H06) contra la entidad elegida.
 * No hay bandera de fallo propia: la unica forma de que falle en este
 * prototipo es sin conexion.
 */
export async function conectarOpenFinance(debug, entidad) {
  await esperar(debug.latenciaMs * 2);
  if (debug.sinConexion) return { ok: false, motivo: 'sin_conexion' };
  return { ok: true, datos: { entidad } };
}
