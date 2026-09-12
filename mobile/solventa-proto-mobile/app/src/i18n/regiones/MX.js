/**
 * Region Mexico (MX).
 *
 * Nota: no ofrece el ramo 'desempleo'. Es intencional: el catalogo de
 * seguros disponibles es por mercado, no todas las regiones ofrecen lo mismo.
 */
const MX = {
  moneda: 'MXN',
  documento: {
    claveEtiqueta: 'documento.curp',
    patron: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
    ejemplo: 'GOMC900315HDFNRL04',
  },
  telefono: {
    prefijo: '+52',
    patron: /^\d{10}$/,
  },
  catalogo: [
    { clave: 'viaje', primaBase: 1200 },
    { clave: 'dispositivos', primaBase: 2100 },
    { clave: 'vida', primaBase: 640 },
  ],
};

export default MX;
