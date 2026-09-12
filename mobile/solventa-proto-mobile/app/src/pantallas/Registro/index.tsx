import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Boton from '../../componentes/Boton';
import Campo from '../../componentes/Campo';
import IndicadorPasos from '../../componentes/IndicadorPasos';
import Selector from '../../componentes/Selector';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { registrarUsuario } from '../../estado/acciones';
import { useRegion } from '../../i18n/regiones';
import { useTextos } from '../../i18n/useTextos';
import { esperar } from '../../servicios/falsos';
import styles from './estilos.module.css';

interface FormularioRegistro {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  direccion1: string;
  direccion2: string;
  ciudad: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  terminosAceptados: boolean;
}

const FORMULARIO_INICIAL: FormularioRegistro = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  tipoDocumento: '',
  numeroDocumento: '',
  telefono: '',
  direccion1: '',
  direccion2: '',
  ciudad: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  terminosAceptados: false,
};

/**
 * Pantalla de registro (H01), en dos pasos manejados con estado local (no
 * con rutas separadas). ALCANCE: prototipo sin validacion — ningun campo se
 * valida (ni formato, ni obligatoriedad, ni coincidencia de contraseñas).
 * El unico bloqueo real es la casilla de terminos, al final del paso 2.
 */
export default function Registro() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const region = useRegion();
  const { t } = useTextos();

  const [formulario, setFormulario] = useState<FormularioRegistro>(FORMULARIO_INICIAL);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  const [terminosExpandidos, setTerminosExpandidos] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);

  const encabezadoRef = useRef<HTMLHeadingElement>(null);
  const esPrimeraRenderizacion = useRef(true);

  // Foco en el <h1> + scroll arriba al cambiar de paso (el .focus() por
  // defecto ya hace scroll-into-view del elemento). Se salta en el montaje
  // inicial: anunciar el paso 1 ni bien carga la pantalla seria ruido.
  useEffect(() => {
    if (esPrimeraRenderizacion.current) {
      esPrimeraRenderizacion.current = false;
      return;
    }
    encabezadoRef.current?.focus();
  }, [paso]);

  function actualizar<K extends keyof FormularioRegistro>(campo: K) {
    return (valor: FormularioRegistro[K]) => {
      setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    };
  }

  const tipoDocumentoSeleccionado = region.tiposDocumento.find(
    (tipo) => tipo.valor === formulario.tipoDocumento
  );
  const ayudaDocumento = tipoDocumentoSeleccionado
    ? t('registro.ejemplo', { ejemplo: tipoDocumentoSeleccionado.ejemplo })
    : null;

  async function crearCuenta() {
    setEnviando(true);
    await esperar(estado.debug.latenciaMs);
    setEnviando(false);

    dispatch(
      registrarUsuario({
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        fechaNacimiento: formulario.fechaNacimiento,
        tipoDocumento: formulario.tipoDocumento,
        documento: formulario.numeroDocumento,
        telefono: formulario.telefono,
        direccion1: formulario.direccion1,
        direccion2: formulario.direccion2,
        ciudad: formulario.ciudad,
        email: formulario.correo,
        terminosAceptados: true,
      })
    );

    // H02 (verificacion de identidad) va en la pantalla siguiente: aqui no
    // se despacha iniciarSesion ni resolverKyc.
    navigate('/verificacion-identidad');
  }

  return (
    <div className={styles.pantalla}>
      <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
        {t('registro.titulo')}
      </h1>

      <IndicadorPasos
        pasoActual={paso}
        totalPasos={2}
        etiquetas={[t('registro.paso1'), t('registro.paso2')]}
      />

      {/* Anuncio para lectores de pantalla del cambio de paso. El texto ya
       * es visible via IndicadorPasos; esta region queda oculta para no
       * duplicarlo visualmente. */}
      <p role="status" className={styles.soloLectorPantalla}>
        {paso === 1 ? t('registro.paso1') : t('registro.paso2')}
      </p>

      {paso === 1 ? (
        <div className={styles.campos}>
          <Campo
            id="nombre"
            etiqueta={t('registro.nombre')}
            tipo="texto"
            valor={formulario.nombre}
            onChange={actualizar('nombre')}
            autoComplete="given-name"
          />
          <Campo
            id="apellido"
            etiqueta={t('registro.apellido')}
            tipo="texto"
            valor={formulario.apellido}
            onChange={actualizar('apellido')}
            autoComplete="family-name"
          />
          <Campo
            id="fecha-nacimiento"
            etiqueta={t('registro.fechaNacimiento')}
            tipo="fecha"
            valor={formulario.fechaNacimiento}
            onChange={actualizar('fechaNacimiento')}
            autoComplete="bday"
          />
          <Selector
            id="tipo-documento"
            etiqueta={t('registro.tipoDocumento')}
            valor={formulario.tipoDocumento}
            onChange={actualizar('tipoDocumento')}
            opciones={region.tiposDocumento.map((tipo) => ({
              valor: tipo.valor,
              etiqueta: t(tipo.claveEtiqueta),
            }))}
          />
          <Campo
            id="numero-documento"
            etiqueta={t('registro.numeroDocumento')}
            tipo="texto"
            valor={formulario.numeroDocumento}
            onChange={actualizar('numeroDocumento')}
            ayuda={ayudaDocumento}
          />

          <Boton anchoCompleto onClick={() => setPaso(2)}>
            {t('comun.continuar')}
          </Boton>
        </div>
      ) : (
        <div className={styles.campos}>
          <Campo
            id="telefono"
            etiqueta={t('registro.telefono')}
            tipo="tel"
            valor={formulario.telefono}
            onChange={actualizar('telefono')}
            autoComplete="tel"
            ayuda={t('registro.prefijo', { prefijo: region.telefono.prefijo })}
          />
          <Campo
            id="direccion1"
            etiqueta={t('registro.direccion1')}
            tipo="texto"
            valor={formulario.direccion1}
            onChange={actualizar('direccion1')}
            autoComplete="address-line1"
          />
          <Campo
            id="direccion2"
            etiqueta={t('registro.direccion2')}
            tipo="texto"
            valor={formulario.direccion2}
            onChange={actualizar('direccion2')}
            autoComplete="address-line2"
            marcador={t('registro.direccion2Marcador')}
          />
          <Selector
            id="ciudad"
            etiqueta={t('registro.ciudad')}
            valor={formulario.ciudad}
            onChange={actualizar('ciudad')}
            opciones={region.ciudades.map((ciudad) => ({
              valor: ciudad,
              etiqueta: ciudad,
            }))}
          />
          <Campo
            id="correo"
            etiqueta={t('registro.correo')}
            tipo="email"
            valor={formulario.correo}
            onChange={actualizar('correo')}
            autoComplete="email"
            inputMode="email"
          />
          <Campo
            id="contrasena"
            etiqueta={t('registro.contrasena')}
            tipo="contrasena"
            valor={formulario.contrasena}
            onChange={actualizar('contrasena')}
            autoComplete="new-password"
            etiquetaMostrar={t('ingreso.mostrarContrasena')}
            etiquetaOcultar={t('ingreso.ocultarContrasena')}
          />
          {/* No se compara con la contraseña anterior: es intencional, no
           * se valida nada en este prototipo. */}
          <Campo
            id="confirmar-contrasena"
            etiqueta={t('registro.confirmarContrasena')}
            tipo="contrasena"
            valor={formulario.confirmarContrasena}
            onChange={actualizar('confirmarContrasena')}
            autoComplete="new-password"
            etiquetaMostrar={t('ingreso.mostrarContrasena')}
            etiquetaOcultar={t('ingreso.ocultarContrasena')}
          />

          <div className={styles.terminos}>
            <label className={styles.terminosEtiqueta}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={formulario.terminosAceptados}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    terminosAceptados: evento.target.checked,
                  }))
                }
              />
              <span>{t('registro.terminos')}</span>
            </label>
            <Boton
              variante="texto"
              tamano="compacto"
              ariaExpanded={terminosExpandidos}
              onClick={() => setTerminosExpandidos((valor) => !valor)}
            >
              {t('registro.verTerminos')}
            </Boton>
            {terminosExpandidos && (
              <p className={styles.terminosTexto}>{t('registro.terminosTexto')}</p>
            )}
          </div>

          <div className={styles.acciones}>
            <Boton
              anchoCompleto
              deshabilitado={!formulario.terminosAceptados}
              cargando={enviando}
              onClick={crearCuenta}
            >
              {t('registro.crearCuenta')}
            </Boton>
            {!formulario.terminosAceptados && (
              <p role="status" className={styles.debeAceptar}>
                {t('registro.debeAceptar')}
              </p>
            )}
            <Boton variante="texto" anchoCompleto onClick={() => setPaso(1)}>
              {t('comun.atras')}
            </Boton>
          </div>
        </div>
      )}

      <div className={styles.pie}>
        <span>{t('registro.yaTengoCuenta')}</span>
        <Boton
          variante="texto"
          tamano="compacto"
          onClick={() => setConfirmandoSalida(true)}
        >
          {t('registro.iniciarSesion')}
        </Boton>
      </div>

      {confirmandoSalida && (
        <div className={styles.confirmarSalida}>
          <p>{t('registro.confirmarSalida')}</p>
          <div className={styles.confirmarSalidaAcciones}>
            <Boton
              variante="secundario"
              tamano="compacto"
              onClick={() => navigate('/ingreso')}
            >
              {t('registro.salirSi')}
            </Boton>
            <Boton
              variante="texto"
              tamano="compacto"
              onClick={() => setConfirmandoSalida(false)}
            >
              {t('registro.salirNo')}
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
