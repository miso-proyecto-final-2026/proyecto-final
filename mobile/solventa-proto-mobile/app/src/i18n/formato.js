/**
 * Formato de moneda, fecha y numero via Intl. Sin librerias externas.
 *
 * Regla dura del prototipo: ninguna pantalla escribe el simbolo de moneda
 * ni concatena fechas a mano. Todo pasa por aqui.
 */
import { useEstado } from '../estado/StoreProvider';
import { useRegion } from './regiones';

/** Combina idioma (i18n) y region (l10n) en un locale para Intl. */
export function construirLocale(idioma, region) {
  return `${idioma}-${region}`;
}

export function formatearMoneda(valor, locale, moneda) {
  if (valor === null || valor === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moneda,
  }).format(valor);
}

export function formatearFecha(iso, locale, estilo = 'corto') {
  if (!iso) return '';
  const dateStyle = estilo === 'largo' ? 'long' : 'short';
  return new Intl.DateTimeFormat(locale, { dateStyle }).format(new Date(iso));
}

export function formatearNumero(valor, locale) {
  if (valor === null || valor === undefined) return '';
  return new Intl.NumberFormat(locale).format(valor);
}

/**
 * Hook: ata moneda/fecha/numero al locale y a la moneda de la region activa,
 * para que las pantallas llamen moneda(valor) sin pasar locale ni codigo de
 * moneda a mano.
 */
export function useFormato() {
  const estado = useEstado();
  const region = useRegion();
  const locale = construirLocale(
    estado.preferencias.idioma,
    estado.preferencias.region
  );

  return {
    locale,
    moneda: (valor) => formatearMoneda(valor, locale, region.moneda),
    fecha: (iso, estilo) => formatearFecha(iso, locale, estilo),
    numero: (valor) => formatearNumero(valor, locale),
  };
}
