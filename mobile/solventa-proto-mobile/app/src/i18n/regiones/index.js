import CO from './CO';
import MX from './MX';
import { useEstado } from '../../estado/StoreProvider';

export const REGIONES = { CO, MX };

/** Devuelve la region pedida, o CO como respaldo si el codigo no existe. */
export function obtenerRegion(codigo) {
  return REGIONES[codigo] || REGIONES.CO;
}

/** Hook: la region activa segun estado.preferencias.region. */
export function useRegion() {
  const estado = useEstado();
  return obtenerRegion(estado.preferencias.region);
}
