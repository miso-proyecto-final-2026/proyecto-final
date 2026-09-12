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
