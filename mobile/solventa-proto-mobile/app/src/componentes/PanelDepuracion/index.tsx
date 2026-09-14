import { useEffect, useRef, useState } from 'react';
import Boton from '../Boton';
import Interruptor from '../Interruptor';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import {
  alternarDebug,
  cambiarIdioma,
  cambiarRegion,
  conectarEntidad,
  confirmarPago,
  emitirCertificado,
  establecerDebug,
  firmarPoliza,
  otorgarConsentimiento,
  recibirCotizacion,
  recibirPagoParametrico,
  registrarUsuario,
  reiniciarSesionPrueba,
  resolverKyc,
  solicitarCotizacion,
} from '../../estado/acciones';
import { notificacionesNoLeidas } from '../../estado/selectores';
import { useRegion } from '../../i18n/regiones';
import styles from './estilos.module.css';

const OPCIONES_LATENCIA = [
  { etiqueta: 'Instantánea (0)', valor: 0 },
  { etiqueta: 'Normal (1200)', valor: 1200 },
  { etiqueta: 'Lenta (4000)', valor: 4000 },
];

/**
 * Panel de depuración: herramienta interna para el equipo, no parte del
 * producto. Es la única pieza del prototipo exenta de useTextos — sus
 * textos van fijos en español en el JSX.
 */
export default function PanelDepuracion() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const region = useRegion();

  const [abierto, setAbierto] = useState(false);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  const botonFlotanteRef = useRef<HTMLButtonElement>(null);
  const encabezadoRef = useRef<HTMLHeadingElement>(null);
  const saltoEnCursoRef = useRef(false);
  const esPrimeraRenderizacion = useRef(true);

  // Foco: al abrir, al encabezado; al cerrar, de vuelta al boton flotante.
  // Se salta en el montaje inicial (no hay nada que anunciar).
  useEffect(() => {
    if (esPrimeraRenderizacion.current) {
      esPrimeraRenderizacion.current = false;
      return;
    }
    if (abierto) {
      encabezadoRef.current?.focus();
    } else {
      botonFlotanteRef.current?.focus();
    }
  }, [abierto]);

  // Escape cierra el panel. No hay atrapado de foco: es deliberadamente no modal.
  useEffect(() => {
    if (!abierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [abierto]);

  // "Cliente con poliza": el id de la poliza lo genera el reducer
  // (CONFIRMAR_PAGO), no el llamador. Se observa estado.polizas y, cuando
  // aparece la poliza recien creada sin firmar, se completa la secuencia.
  // No se toca el reducer ni las acciones para esto.
  useEffect(() => {
    if (!saltoEnCursoRef.current) return;
    const pendiente = estado.polizas.find((poliza) => !poliza.firmada);
    if (pendiente) {
      dispatch(firmarPoliza(pendiente.id));
      dispatch(emitirCertificado(pendiente.id));
      saltoEnCursoRef.current = false;
    }
  }, [estado.polizas, dispatch]);

  function datosClienteDemo() {
    const tipoDoc = region.tiposDocumento[0];
    return {
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana.gomez@ejemplo.com',
      telefono: '3001234567',
      fechaNacimiento: '1990-03-15',
      ciudad: region.ciudades[0],
      direccion1: 'Calle 123 # 45-67',
      direccion2: '',
      tipoDocumento: tipoDoc.valor,
      documento: tipoDoc.ejemplo,
      terminosAceptados: true,
    };
  }

  function clienteVerificado() {
    dispatch(reiniciarSesionPrueba());
    dispatch(registrarUsuario(datosClienteDemo()));
    dispatch(resolverKyc(true));
  }

  function clienteConConsentimiento() {
    clienteVerificado();
    const entidadDemo = region.entidades[0];
    dispatch(otorgarConsentimiento({ codigo: entidadDemo.codigo, nombre: entidadDemo.nombre }));
  }

  // Cotiza pero NO compra: a diferencia de "Cliente con poliza", deja la
  // cotizacion viva (estado LISTA) para poder probar que pasa cuando se
  // revoca el consentimiento con una cotizacion personalizada pendiente.
  function clienteConCotizacionViva() {
    clienteConConsentimiento();
    dispatch(solicitarCotizacion('viaje', { dias: 10, destino: 'Europa' }));
    const ramoViaje = region.catalogo.find((item) => item.clave === 'viaje');
    dispatch(
      recibirCotizacion({
        primaBase: ramoViaje ? ramoViaje.primaBase : 0,
        moneda: region.moneda,
        coberturas: ['cancelacion', 'asistencia_medica', 'equipaje'],
      })
    );
  }

  function clienteConPoliza() {
    saltoEnCursoRef.current = true;
    clienteConConsentimiento();
    // Segunda entidad conectada: para que este caso sirva de prueba con
    // varias entidades conectadas a la vez.
    const segundaEntidad = region.entidades[1];
    if (segundaEntidad) {
      dispatch(
        conectarEntidad({ codigo: segundaEntidad.codigo, nombre: segundaEntidad.nombre })
      );
    }
    dispatch(solicitarCotizacion('viaje', { dias: 10, destino: 'Europa' }));
    const ramoViaje = region.catalogo.find((item) => item.clave === 'viaje');
    dispatch(
      recibirCotizacion({
        primaBase: ramoViaje ? ramoViaje.primaBase : 0,
        moneda: region.moneda,
        coberturas: ['cancelacion', 'asistencia_medica', 'equipaje'],
      })
    );
    dispatch(confirmarPago());
    // firmarPoliza + emitirCertificado: ver el useEffect sobre estado.polizas.
  }

  const primeraPoliza = estado.polizas[0];
  const polizaPendienteCertificado = estado.polizas.find(
    (poliza) => poliza.firmada && !poliza.certificado
  );

  function dispararPagoParametrico() {
    if (!primeraPoliza) return;
    dispatch(
      recibirPagoParametrico(
        primeraPoliza.id,
        Math.round(primeraPoliza.prima * 0.3),
        'retraso_vuelo'
      )
    );
  }

  function emitirCertificadoPendiente() {
    if (!polizaPendienteCertificado) return;
    dispatch(emitirCertificado(polizaPendienteCertificado.id));
  }

  const sinLeer = notificacionesNoLeidas(estado);

  return (
    <>
      {!abierto && (
        <button
          ref={botonFlotanteRef}
          type="button"
          className={styles.botonFlotante}
          aria-label="Panel de desarrollo"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6l-3 3-4.3-4.3C.6 7.1 1 10.1 3 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.4-.4.4-1 0-1.4z"
            />
          </svg>
        </button>
      )}

      {abierto && (
        <aside className={styles.hoja} role="dialog" aria-label="Panel de desarrollo">
          <header className={styles.encabezado}>
            <div>
              <h2 ref={encabezadoRef} tabIndex={-1} className={styles.tituloPanel}>
                Panel de desarrollo
              </h2>
              <p className={styles.leyenda}>
                Herramienta interna. No forma parte del producto.
              </p>
            </div>
            <Boton variante="texto" tamano="compacto" onClick={() => setAbierto(false)}>
              Cerrar
            </Boton>
          </header>

          <div className={styles.contenido}>
            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Estado actual</h3>
              <dl className={styles.listaEstado}>
                <div className={styles.filaEstado}>
                  <dt>KYC</dt>
                  <dd>{estado.usuario.estadoKyc}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Sesión</dt>
                  <dd>{estado.usuario.sesionIniciada ? 'iniciada' : 'cerrada'}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Biometría</dt>
                  <dd>{estado.usuario.biometriaActiva ? 'activa' : 'inactiva'}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Consentimiento</dt>
                  <dd>
                    {estado.consentimiento.otorgado
                      ? `otorgado (${estado.consentimiento.entidades.length} entidad${estado.consentimiento.entidades.length === 1 ? '' : 'es'})`
                      : 'no otorgado'}
                  </dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Cotización</dt>
                  <dd>{estado.cotizacion ? estado.cotizacion.estado : 'ninguna'}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Pólizas</dt>
                  <dd>{estado.polizas.length}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Notificaciones</dt>
                  <dd>
                    {estado.notificaciones.length} ({sinLeer.length} sin leer)
                  </dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Región</dt>
                  <dd>{estado.preferencias.region}</dd>
                </div>
                <div className={styles.filaEstado}>
                  <dt>Idioma</dt>
                  <dd>{estado.preferencias.idioma}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Reiniciar</h3>
              <Boton
                variante="peligro"
                anchoCompleto
                onClick={() => setConfirmandoReinicio(true)}
              >
                Reiniciar sesión de prueba
              </Boton>
              {confirmandoReinicio && (
                <div className={styles.confirmacion}>
                  <p>¿Reiniciar la sesión de prueba?</p>
                  <div className={styles.confirmacionAcciones}>
                    <Boton
                      variante="peligro"
                      tamano="compacto"
                      onClick={() => {
                        dispatch(reiniciarSesionPrueba());
                        setConfirmandoReinicio(false);
                      }}
                    >
                      Sí
                    </Boton>
                    <Boton
                      variante="texto"
                      tamano="compacto"
                      onClick={() => setConfirmandoReinicio(false)}
                    >
                      No
                    </Boton>
                  </div>
                </div>
              )}
              <p className={styles.notaPequena}>Conserva región, idioma y banderas.</p>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Saltos de estado</h3>
              <div className={styles.saltos}>
                <Boton variante="secundario" anchoCompleto onClick={clienteVerificado}>
                  Cliente verificado
                </Boton>
                <Boton
                  variante="secundario"
                  anchoCompleto
                  onClick={clienteConConsentimiento}
                >
                  Cliente con consentimiento
                </Boton>
                <Boton
                  variante="secundario"
                  anchoCompleto
                  onClick={clienteConCotizacionViva}
                >
                  Cliente con cotización viva
                </Boton>
                <Boton variante="secundario" anchoCompleto onClick={clienteConPoliza}>
                  Cliente con póliza
                </Boton>
              </div>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Disparadores</h3>
              <div className={styles.saltos}>
                <Boton
                  variante="secundario"
                  anchoCompleto
                  deshabilitado={!primeraPoliza}
                  onClick={dispararPagoParametrico}
                >
                  Disparar pago paramétrico (H30)
                </Boton>
                <Boton
                  variante="secundario"
                  anchoCompleto
                  deshabilitado={!polizaPendienteCertificado}
                  onClick={emitirCertificadoPendiente}
                >
                  Emitir certificado pendiente (H22)
                </Boton>
              </div>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Región</h3>
              <div className={styles.filaBotones}>
                {(['CO', 'MX'] as const).map((codigo) => (
                  <Boton
                    key={codigo}
                    variante={
                      estado.preferencias.region === codigo ? 'primario' : 'secundario'
                    }
                    tamano="compacto"
                    ariaPressed={estado.preferencias.region === codigo}
                    onClick={() => dispatch(cambiarRegion(codigo))}
                  >
                    {codigo}
                  </Boton>
                ))}
              </div>
              <p className={styles.avisoRegion}>
                Cambiar de región limpia el documento y anula la cotización.
              </p>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Idioma</h3>
              <div className={styles.filaBotones}>
                {(['es', 'en'] as const).map((codigo) => (
                  <Boton
                    key={codigo}
                    variante={
                      estado.preferencias.idioma === codigo ? 'primario' : 'secundario'
                    }
                    tamano="compacto"
                    ariaPressed={estado.preferencias.idioma === codigo}
                    onClick={() => dispatch(cambiarIdioma(codigo))}
                  >
                    {codigo.toUpperCase()}
                  </Boton>
                ))}
              </div>
              <p className={styles.notaPequena}>
                Duplicado por comodidad: también vive en Ajustes.
              </p>
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Banderas</h3>
              <Interruptor
                id="depuracion-sin-conexion"
                etiqueta="Sin conexión"
                activo={estado.debug.sinConexion}
                onChange={() => dispatch(alternarDebug('sinConexion'))}
              />
              <Interruptor
                id="depuracion-forzar-fallo-kyc"
                etiqueta="Forzar fallo de KYC"
                activo={estado.debug.forzarFalloKyc}
                onChange={() => dispatch(alternarDebug('forzarFalloKyc'))}
              />
              <Interruptor
                id="depuracion-forzar-fallo-pago"
                etiqueta="Forzar fallo de pago"
                activo={estado.debug.forzarFalloPago}
                onChange={() => dispatch(alternarDebug('forzarFalloPago'))}
              />
              <Interruptor
                id="depuracion-textos-largos"
                etiqueta="Textos largos"
                activo={estado.debug.textosLargos}
                onChange={() => dispatch(alternarDebug('textosLargos'))}
              />
            </section>

            <section className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>Latencia</h3>
              <div className={styles.filaBotones}>
                {OPCIONES_LATENCIA.map((opcion) => (
                  <Boton
                    key={opcion.valor}
                    variante={
                      estado.debug.latenciaMs === opcion.valor ? 'primario' : 'secundario'
                    }
                    tamano="compacto"
                    ariaPressed={estado.debug.latenciaMs === opcion.valor}
                    onClick={() => dispatch(establecerDebug('latenciaMs', opcion.valor))}
                  >
                    {opcion.etiqueta}
                  </Boton>
                ))}
              </div>
            </section>

            <section className={styles.seccion}>
              <details className={styles.estadoCompleto}>
                <summary>Ver estado completo</summary>
                <pre className={styles.pre}>{JSON.stringify(estado, null, 2)}</pre>
              </details>
            </section>
          </div>
        </aside>
      )}
    </>
  );
}
