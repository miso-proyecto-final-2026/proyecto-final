import { useEstado } from '../../estado/StoreProvider';
import styles from './estilos.module.css';

// TODO: pendiente de implementar de verdad (tabs, iconos, estado activo).
// Por ahora solo resuelve la visibilidad: la barra inferior solo tiene
// sentido con sesion iniciada (H05); en pantallas pre-login (Bienvenida,
// Registro, etc.) no debe verse.
export default function BarraNavegacion() {
  const estado = useEstado();

  if (!estado.usuario.sesionIniciada) return null;

  return <div className={styles.contenedor}>BarraNavegacion</div>;
}
