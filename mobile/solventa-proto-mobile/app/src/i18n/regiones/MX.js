/**
 * Region Mexico (MX).
 *
 * Nota: no ofrece el ramo 'desempleo'. Es intencional: el catalogo de
 * seguros disponibles es por mercado, no todas las regiones ofrecen lo mismo.
 */
const MX = {
  moneda: 'MXN',
  tiposDocumento: [
    { valor: 'CURP', claveEtiqueta: 'documento.curp', ejemplo: 'GOMC900315HDFNRL04' },
    { valor: 'INE', claveEtiqueta: 'documento.ine', ejemplo: '1234567890ABCDEFGH' },
    { valor: 'PA', claveEtiqueta: 'documento.pasaporte', ejemplo: 'G12345678' },
  ],
  ciudades: ['Ciudad de Mexico', 'Guadalajara', 'Monterrey', 'Puebla', 'Merida'],
  // Marcas reales usadas solo como referencia visual en un prototipo
  // academico: nada de logos ni imagenes, solo el nombre en texto.
  entidades: [
    { codigo: 'bbva_mx', nombre: 'BBVA Mexico' },
    { codigo: 'banorte', nombre: 'Banorte' },
    { codigo: 'santander', nombre: 'Santander Mexico' },
    { codigo: 'nu_mx', nombre: 'Nu Mexico' },
  ],
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
