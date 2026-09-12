import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Boton from '../../componentes/Boton';
import Campo from '../../componentes/Campo';
import { useDispatch, useEstado } from '../../estado/StoreProvider';
import { iniciarSesion, registrarUsuario, resolverKyc } from '../../estado/acciones';
import { useTextos } from '../../i18n/useTextos';
import { autenticar } from '../../servicios/falsos';
import styles from './estilos.module.css';

/**
 * Documento de demostracion por region. CO usa cedula, MX usa CURP: no son
 * intercambiables (ver app/src/i18n/regiones).
 */
const DOCUMENTO_DEMO_POR_REGION = {
  CO: '1020345678',
  MX: 'GOMC900315HDFNRL04',
};

/**
 * Pantalla de ingreso (NOTA DE ALCANCE): es un prototipo y el ingreso con
 * credenciales no corresponde a ninguna historia de usuario. No valida nada:
 * cualquier clic en "Entrar" continua al menu principal, incluso con los
 * campos vacios.
 */
export default function Ingreso() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTextos();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarFueraDeAlcance, setMostrarFueraDeAlcance] = useState(false);

  if (estado.usuario.sesionIniciada) {
    return <Navigate to="/inicio" replace />;
  }

  async function entrar() {
    setEnviando(true);
    await autenticar(estado.debug);
    setEnviando(false);

    if (!estado.usuario.email) {
      // Nadie se registro en esta sesion: carga un usuario de demostracion
      // para poder seguir navegando el prototipo desde "/inicio".
      dispatch(
        registrarUsuario({
          nombre: 'Ana',
          apellido: 'Gomez',
          email: correo || 'ana.gomez@ejemplo.com',
          telefono: '3001234567',
          documento:
            estado.preferencias.region === 'MX'
              ? DOCUMENTO_DEMO_POR_REGION.MX
              : DOCUMENTO_DEMO_POR_REGION.CO,
        })
      );
      // resolverKyc(true) ya deja sesionIniciada en true.
      dispatch(resolverKyc(true));
    } else {
      // El usuario ya se registro en esta sesion: solo falta iniciar sesion.
      dispatch(iniciarSesion());
    }

    navigate('/inicio');
  }

  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>{t('ingreso.titulo')}</h1>
        <p className={styles.subtitulo}>{t('ingreso.subtitulo')}</p>
      </div>

      {estado.usuario.biometriaActiva && (
        <>
          <Boton
            variante="secundario"
            anchoCompleto
            onClick={() => {
              // TODO: se implementa junto con HojaModal (confirmacion
              // biometrica en una hoja modal). Por ahora no hace nada.
            }}
          >
            {t('ingreso.entrarBiometria')}
          </Boton>
          <div className={styles.separador}>
            <span>{t('ingreso.separador')}</span>
          </div>
        </>
      )}

      <div className={styles.campos}>
        <Campo
          id="correo"
          etiqueta={t('ingreso.correo')}
          tipo="email"
          valor={correo}
          onChange={setCorreo}
          marcador={t('ingreso.correoMarcador')}
          autoComplete="email"
          inputMode="email"
        />
        <Campo
          id="contrasena"
          etiqueta={t('ingreso.contrasena')}
          tipo="contrasena"
          valor={contrasena}
          onChange={setContrasena}
          autoComplete="current-password"
          etiquetaMostrar={t('ingreso.mostrarContrasena')}
          etiquetaOcultar={t('ingreso.ocultarContrasena')}
        />
      </div>

      <Boton anchoCompleto cargando={enviando} onClick={entrar}>
        {t('ingreso.entrar')}
      </Boton>

      <Boton
        variante="texto"
        anchoCompleto
        onClick={() => setMostrarFueraDeAlcance(true)}
      >
        {t('ingreso.contrasenaOlvidada')}
      </Boton>
      {mostrarFueraDeAlcance && (
        <p role="status" className={styles.fueraDeAlcance}>
          {t('ingreso.fueraDeAlcance')}
        </p>
      )}

      <div className={styles.pie}>
        <span>{t('ingreso.sinCuenta')}</span>
        <Boton variante="texto" tamano="compacto" onClick={() => navigate('/registro')}>
          {t('ingreso.crearCuenta')}
        </Boton>
      </div>
    </div>
  );
}
