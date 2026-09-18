import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Aviso from '../../componentes/Aviso';
import Boton from '../../componentes/Boton';
import Campo from '../../componentes/Campo';
import Cargando from '../../componentes/Cargando';
import HojaModal from '../../componentes/HojaModal';
import Selector from '../../componentes/Selector';
import Tarjeta from '../../componentes/Tarjeta';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { fallarCotizacion, recibirCotizacion, solicitarCotizacion } from '../../estado/acciones';
import { consentimientoVigente, entidadesConectadas } from '../../estado/selectores';
import { useFormato } from '../../i18n/formato';
import { useRegion } from '../../i18n/regiones';
import { PARAMETROS_RAMO } from '../../i18n/regiones/parametrosRamo';
import { useTextos } from '../../i18n/useTextos';
import { cotizar } from '../../servicios/falsos';
import styles from './estilos.module.css';

type ParametroRamo = (typeof PARAMETROS_RAMO)[string][number];
type Valores = Record<string, string>;

const propiedadesIcono = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

function IconoViaje() {
  return (
    <svg {...propiedadesIcono}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
    </svg>
  );
}

function IconoDispositivos() {
  return (
    <svg {...propiedadesIcono}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <line x1="11" y1="18.5" x2="13" y2="18.5" />
    </svg>
  );
}

function IconoVida() {
  return (
    <svg {...propiedadesIcono}>
      <path d="M12 20.5s-8-4.9-8-10.5A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 20 10c0 5.6-8 10.5-8 10.5Z" />
    </svg>
  );
}

function IconoDesempleo() {
  return (
    <svg {...propiedadesIcono}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    </svg>
  );
}

const ICONOS_RAMO: Record<string, () => ReactNode> = {
  viaje: IconoViaje,
  dispositivos: IconoDispositivos,
  vida: IconoVida,
  desempleo: IconoDesempleo,
};

/** Valor inicial de cada campo: porDefecto, o la primera opcion en los
 * selectores. Los campos sin valor por defecto (moneda) arrancan vacios. */
function valoresIniciales(definiciones: ParametroRamo[]): Valores {
  const valores: Valores = {};
  for (const definicion of definiciones) {
    if (definicion.tipo === 'selector') {
      valores[definicion.nombre] = definicion.opciones?.[0] ?? '';
    } else {
      valores[definicion.nombre] =
        definicion.porDefecto !== undefined ? String(definicion.porDefecto) : '';
    }
  }
  return valores;
}

/** Sin validacion a proposito: un campo vacio o no numerico cae a su valor
 * por defecto (o a 1) y el servicio acota el factor de la prima. */
function aNumero(crudo: string, respaldo: number): number {
  const limpio = crudo.trim();
  const numero = Number(limpio);
  return limpio !== '' && Number.isFinite(numero) ? numero : respaldo;
}

function construirParametros(definiciones: ParametroRamo[], valores: Valores) {
  const parametros: Record<string, string | number> = {};
  for (const definicion of definiciones) {
    const crudo = valores[definicion.nombre] ?? '';
    parametros[definicion.nombre] =
      definicion.tipo === 'selector' ? crudo : aNumero(crudo, definicion.porDefecto ?? 1);
  }
  return parametros;
}

/**
 * Nueva cotizacion (H37), en /cotizacion/nueva. Paso 1: elegir ramo. Paso 2: parametros del ramo.
 * Al calcular, una hoja reconfirma el uso de datos si hay consentimiento, o
 * avisa que el precio sera estimado si no lo hay; solo entonces se llama al
 * servicio. La cotizacion es libre: nunca exige verificacion de identidad.
 */
export default function Cotizacion() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const region = useRegion();
  const formato = useFormato();
  const { t } = useTextos();

  const [ramo, setRamo] = useState<string | null>(null);
  const [valores, setValores] = useState<Valores>({});
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [motivoError, setMotivoError] = useState<string | null>(null);

  const encabezadoRef = useRef<HTMLHeadingElement>(null);
  const esPrimeraRenderizacion = useRef(true);
  const montada = useRef(true);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  // Foco en el <h1> al cambiar de paso; se salta en el montaje inicial.
  useEffect(() => {
    if (esPrimeraRenderizacion.current) {
      esPrimeraRenderizacion.current = false;
      return;
    }
    encabezadoRef.current?.focus();
  }, [ramo]);

  if (!estado.usuario.sesionIniciada) {
    return <Navigate to="/" replace />;
  }

  const sinConexion = estado.debug.sinConexion;
  const conConsentimiento = consentimientoVigente(estado);
  const definiciones: ParametroRamo[] = ramo ? (PARAMETROS_RAMO[ramo] ?? []) : [];

  function elegirRamo(clave: string) {
    setRamo(clave);
    setValores(valoresIniciales(PARAMETROS_RAMO[clave] ?? []));
    setMotivoError(null);
  }

  function actualizar(nombre: string) {
    return (valor: string) => setValores((previos) => ({ ...previos, [nombre]: valor }));
  }

  async function calcular() {
    if (!ramo) return;
    const entradaCatalogo = region.catalogo.find((e: { clave: string }) => e.clave === ramo);
    if (!entradaCatalogo) return;

    const parametros = construirParametros(definiciones, valores);
    setHojaAbierta(false);
    setMotivoError(null);
    setCalculando(true);
    dispatch(solicitarCotizacion(ramo, parametros));

    const resultado = await cotizar(estado.debug, {
      ramo,
      parametros,
      primaBase: entradaCatalogo.primaBase,
      moneda: region.moneda,
    });

    if (resultado.ok) {
      dispatch(recibirCotizacion(resultado.datos));
      // Si el usuario ya salio de la pantalla mientras se calculaba, la
      // cotizacion queda guardada pero no lo arrastramos a otra ruta.
      if (montada.current) navigate('/resultado-cotizacion', { replace: true });
      return;
    }

    const motivo = resultado.motivo ?? 'desconocido';
    dispatch(fallarCotizacion(motivo));
    setCalculando(false);
    setMotivoError(motivo);
  }

  function irAAutorizar() {
    navigate('/consentimiento', { state: { volverA: '/cotizacion/nueva' } });
  }

  if (calculando) {
    return (
      <div className={styles.pantalla}>
        <Cargando mensaje={t('cotizacion.calculando')} />
      </div>
    );
  }

  const hoja = (
    <HojaModal
      abierta={hojaAbierta}
      onCerrar={() => setHojaAbierta(false)}
      titulo={conConsentimiento ? t('cotizacion.compartirTitulo') : t('cotizacion.estimadaTitulo')}
      acciones={
        conConsentimiento ? (
          <>
            <Boton anchoCompleto onClick={calcular}>
              {t('cotizacion.compartirAceptar')}
            </Boton>
            <Boton variante="texto" anchoCompleto onClick={() => setHojaAbierta(false)}>
              {t('comun.cancelar')}
            </Boton>
          </>
        ) : (
          <>
            <Boton anchoCompleto onClick={calcular}>
              {t('cotizacion.continuarEstimada')}
            </Boton>
            <Boton variante="secundario" anchoCompleto onClick={irAAutorizar}>
              {t('cotizacion.irAutorizar')}
            </Boton>
            <Boton variante="texto" anchoCompleto onClick={() => setHojaAbierta(false)}>
              {t('comun.cancelar')}
            </Boton>
          </>
        )
      }
    >
      {conConsentimiento ? (
        <>
          <p>{t('cotizacion.compartirDetalle')}</p>
          <ul className={styles.listaEntidades}>
            {entidadesConectadas(estado).map((entidad: { codigo: string; nombre: string }) => (
              <li key={entidad.codigo} className={styles.entidad}>
                {entidad.nombre}
              </li>
            ))}
          </ul>
          <p className={styles.nota}>{t('cotizacion.compartirRevocar')}</p>
        </>
      ) : (
        <p>{t('cotizacion.estimadaDetalle')}</p>
      )}
    </HojaModal>
  );

  // --- PASO 1: elegir el ramo ------------------------------------------------
  if (!ramo) {
    return (
      <div className={styles.pantalla}>
        {sinConexion && <Aviso tono="advertencia">{t('cotizacion.sinConexion')}</Aviso>}

        <div className={styles.encabezado}>
          <div className={styles.volver}>
            <Boton variante="texto" tamano="compacto" onClick={() => navigate('/cotizacion')}>
              {t('comun.atras')}
            </Boton>
          </div>
          <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
            {t('cotizacion.titulo')}
          </h1>
        </div>

        <div className={styles.tarjetas}>
          {region.catalogo.map((entrada: { clave: string }) => {
            const Icono = ICONOS_RAMO[entrada.clave] ?? IconoDesempleo;
            return (
              <Tarjeta
                key={entrada.clave}
                titulo={t(`seguros.${entrada.clave}`)}
                descripcion={t(`cotizacion.ramo.${entrada.clave}`)}
                icono={<Icono />}
                onClick={() => elegirRamo(entrada.clave)}
              />
            );
          })}
        </div>

      </div>
    );
  }

  // --- PASO 2: parametros del ramo -------------------------------------------
  return (
    <div className={styles.pantalla}>
      {sinConexion && <Aviso tono="advertencia">{t('cotizacion.sinConexion')}</Aviso>}

      <div className={styles.encabezado}>
        <div className={styles.volver}>
          <Boton variante="texto" tamano="compacto" onClick={() => setRamo(null)}>
            {t('comun.atras')}
          </Boton>
        </div>
        <h1 ref={encabezadoRef} tabIndex={-1} className={styles.titulo}>
          {t(`seguros.${ramo}`)}
        </h1>
      </div>

      <div className={styles.campos}>
        {definiciones.map((definicion) => {
          const id = `cotizacion-${definicion.nombre}`;
          const etiqueta = t(definicion.claveEtiqueta);
          const valor = valores[definicion.nombre] ?? '';

          if (definicion.tipo === 'selector') {
            return (
              <Selector
                key={definicion.nombre}
                id={id}
                etiqueta={etiqueta}
                valor={valor}
                onChange={actualizar(definicion.nombre)}
                opciones={(definicion.opciones ?? []).map((opcion) => ({
                  valor: opcion,
                  etiqueta: t(`cotizacion.opciones.${definicion.nombre}.${opcion}`),
                }))}
              />
            );
          }

          const ayuda =
            definicion.tipo === 'moneda'
              ? t('cotizacion.monedaAyuda', { moneda: region.moneda })
              : definicion.min !== undefined && definicion.max !== undefined
                ? t('cotizacion.rango', {
                    min: formato.numero(definicion.min),
                    max: formato.numero(definicion.max),
                  })
                : null;

          return (
            <Campo
              key={definicion.nombre}
              id={id}
              tipo="numero"
              etiqueta={etiqueta}
              valor={valor}
              onChange={actualizar(definicion.nombre)}
              ayuda={ayuda}
            />
          );
        })}
      </div>

      {motivoError && (
        <Aviso tono="error">
          {motivoError === 'sin_conexion' ? t('errores.sinConexion') : t('errores.generico')}
        </Aviso>
      )}

      <Boton anchoCompleto deshabilitado={sinConexion} onClick={() => setHojaAbierta(true)}>
        {t('cotizacion.calcular')}
      </Boton>

      {hoja}
    </div>
  );
}
