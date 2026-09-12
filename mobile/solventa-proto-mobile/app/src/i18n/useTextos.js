/**
 * Textos de interfaz (i18n). Sin librerias externas.
 *
 * useTextos() resuelve claves con puntos sobre el JSON del idioma activo,
 * interpola {marcadores} y, en modo depuracion, aplica pseudo-localizacion
 * para detectar desbordes de interfaz.
 */
import { useEstado } from '../estado/StoreProvider';
import es from './textos/es.json';
import en from './textos/en.json';

const TEXTOS = { es, en };

function resolverClave(diccionario, clave) {
  return clave
    .split('.')
    .reduce((nodo, parte) => (nodo == null ? undefined : nodo[parte]), diccionario);
}

function interpolar(texto, datos) {
  if (!datos) return texto;
  return texto.replace(/\{(\w+)\}/g, (coincidencia, nombre) =>
    datos[nombre] !== undefined ? String(datos[nombre]) : coincidencia
  );
}

/**
 * Pseudo-localizacion: envuelve el texto entre corchetes y lo alarga cerca
 * de un 40% repitiendo sus propios caracteres, para detectar desbordes de
 * interfaz sin necesidad de traducir de verdad.
 */
function pseudoLocalizar(texto) {
  const relleno = Math.ceil(texto.length * 0.4);
  let extra = '';
  while (extra.length < relleno) {
    extra += texto[extra.length % texto.length] || '~';
  }
  return `[${texto}${extra}]`;
}

export function useTextos() {
  const estado = useEstado();
  const idioma = estado.preferencias.idioma;
  const diccionario = TEXTOS[idioma] || TEXTOS.es;

  function t(clave, datos) {
    const valor = resolverClave(diccionario, clave);
    if (typeof valor !== 'string') {
      console.warn(`[i18n] Clave de texto no encontrada: "${clave}"`);
      return clave;
    }
    const resultado = interpolar(valor, datos);
    return estado.debug.textosLargos ? pseudoLocalizar(resultado) : resultado;
  }

  return { t, idioma };
}

export default useTextos;
