import { Navigate, useNavigate } from 'react-router';
import Boton from '../../componentes/Boton';
import { useEstado } from '../../estado/StoreProvider';
import { puedeEntrarConBiometria } from '../../estado/selectores';
import { useTextos } from '../../i18n/useTextos';
import styles from './estilos.module.css';

/**
 * Ilustracion decorativa: formas geometricas abstractas con los colores del
 * tema. Puramente ornamental, por eso aria-hidden. No es un componente
 * reutilizable de src/componentes: es arte especifico de esta pantalla.
 */
function IlustracionBienvenida() {
  return (
    <svg
      className={styles.ilustracion}
      viewBox="0 0 160 120"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.formaSuave} cx="40" cy="60" r="46" />
      <rect
        className={styles.formaAcento}
        x="86"
        y="24"
        width="56"
        height="56"
        rx="18"
      />
      <circle className={styles.formaPrimaria} cx="100" cy="88" r="22" />
    </svg>
  );
}

export default function Bienvenida() {
  const estado = useEstado();
  const navigate = useNavigate();
  const { t } = useTextos();

  // H05: si ya hay sesion iniciada, esta pantalla no aplica.
  if (estado.usuario.sesionIniciada) {
    return <Navigate to="/inicio" replace />;
  }

  const conBiometria = puedeEntrarConBiometria(estado);

  return (
    <div className={styles.pantalla}>
      <div className={styles.contenidoSuperior}>
        <h1 className={styles.marca}>{t('bienvenida.titulo')}</h1>
        <p className={styles.eslogan}>{t('bienvenida.eslogan')}</p>
        <IlustracionBienvenida />
      </div>

      <div className={styles.acciones}>
        {conBiometria ? (
          <>
            <Boton
              anchoCompleto
              onClick={() => navigate('/ingreso-biometrico')}
            >
              {t('bienvenida.entrarBiometria')}
            </Boton>
            <Boton
              variante="secundario"
              anchoCompleto
              onClick={() => navigate('/registro')}
            >
              {t('bienvenida.crearCuenta')}
            </Boton>
          </>
        ) : (
          <>
            <Boton anchoCompleto onClick={() => navigate('/registro')}>
              {t('bienvenida.crearCuenta')}
            </Boton>
            <Boton
              variante="texto"
              anchoCompleto
              onClick={() => navigate('/ingreso-biometrico')}
            >
              {t('bienvenida.yaTengoCuenta')}
            </Boton>
          </>
        )}
      </div>
    </div>
  );
}
