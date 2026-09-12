/**
 * Region Colombia (CO).
 *
 * Describe SOLO lo que cambia entre mercados: moneda, formato del documento
 * de identidad, telefono y catalogo de seguros ofrecidos. El locale
 * (idioma + region) se arma en i18n/formato.js, no aqui.
 */
const CO = {
  moneda: 'COP',
  documento: {
    claveEtiqueta: 'documento.cedula',
    patron: /^\d{6,10}$/,
    ejemplo: '1020345678',
  },
  telefono: {
    prefijo: '+57',
    patron: /^\d{10}$/,
  },
  catalogo: [
    { clave: 'viaje', primaBase: 180000 },
    { clave: 'dispositivos', primaBase: 320000 },
    { clave: 'vida', primaBase: 95000 },
    { clave: 'desempleo', primaBase: 140000 },
  ],
};

export default CO;
