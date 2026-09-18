import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router';

import MarcoMovil from '~/src/componentes/MarcoMovil';
import BarraNavegacion from '~/src/componentes/BarraNavegacion';
import BannerPush from '~/src/componentes/BannerPush';
import PanelDepuracion from '~/src/componentes/PanelDepuracion';

import { useDispatch, useEstado } from '~/src/estado/StoreProvider';
import { marcarNotificacionLeida } from '~/src/estado/acciones';
import { useFormato } from '~/src/i18n/formato';
import { useTextos } from '~/src/i18n/useTextos';

import Bienvenida from '~/src/pantallas/Bienvenida';
import Registro from '~/src/pantallas/Registro';
import VerificacionIdentidad from '~/src/pantallas/VerificacionIdentidad';
import ResultadoVerificacion from '~/src/pantallas/ResultadoVerificacion';
import ConfiguracionBiometria from '~/src/pantallas/ConfiguracionBiometria';
import Ingreso from '~/src/pantallas/Ingreso';
import Consentimiento from '~/src/pantallas/Consentimiento';
import Inicio from '~/src/pantallas/Inicio';
import HistorialCotizaciones from '~/src/pantallas/HistorialCotizaciones';
import Cotizacion from '~/src/pantallas/Cotizacion';
import ResultadoCotizacion from '~/src/pantallas/ResultadoCotizacion';
import Pago from '~/src/pantallas/Pago';
import FirmaPoliza from '~/src/pantallas/FirmaPoliza';
import ConfirmacionCertificado from '~/src/pantallas/ConfirmacionCertificado';
import Billetera from '~/src/pantallas/Billetera';
import DetallePoliza from '~/src/pantallas/DetallePoliza';
import Notificaciones from '~/src/pantallas/Notificaciones';
import Ajustes from '~/src/pantallas/Ajustes';

// Este modulo hace las veces del "src/App.jsx" del encargo original: define
// las rutas de pantalla con <Routes>/<Route> clasicos de react-router.
//
// IMPORTANTE: no envolver esto en <BrowserRouter>. El modo framework de
// React Router v8 ya provee un unico Router (via RouterProvider, generado
// por app/routes.ts); <Routes>/<Route>/useNavigate/<Navigate> solo necesitan
// encontrar ese Router ambiente, no crear uno nuevo. Anidar <BrowserRouter>
// aqui produce "You cannot render a <Router> inside another <Router>".
export default function AppRoutes() {
  const estado = useEstado();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formato = useFormato();
  const { t } = useTextos();

  // --- BannerPush: avisa de cada notificacion nueva (H22, H30) -------------
  // Las notificaciones se agregan al inicio del arreglo, asi que la mas
  // reciente es la primera. Se recuerda cual fue la ultima mostrada para que
  // una misma notificacion no vuelva a saltar; las que ya existian al montar
  // la app no se muestran.
  const [idBanner, setIdBanner] = useState<string | null>(null);
  const ultimaMostradaRef = useRef<string | null>(estado.notificaciones[0]?.id ?? null);

  useEffect(() => {
    const masReciente = estado.notificaciones[0];
    if (!masReciente || masReciente.leida) return;
    if (masReciente.id === ultimaMostradaRef.current) return;
    ultimaMostradaRef.current = masReciente.id;
    setIdBanner(masReciente.id);
  }, [estado.notificaciones]);

  // Derivada: si la notificacion desaparece (reinicio de sesion de prueba) o
  // ya se leyo, el banner deja de mostrarse solo.
  const notificacionBanner = estado.notificaciones.find(
    (n: { id: string; leida: boolean }) => n.id === idBanner && !n.leida
  );

  // Los datos del texto vienen crudos del reducer: el monto y el evento se
  // formatean/traducen aqui.
  function textoDe(clave: string) {
    const datos = notificacionBanner?.datos ?? {};
    return t(clave, {
      ...datos,
      monto: typeof datos.monto === 'number' ? formato.numero(datos.monto) : datos.monto,
      evento: datos.evento ? t(`notificaciones.eventos.${datos.evento}`) : datos.evento,
    });
  }

  function pulsarBanner() {
    if (!notificacionBanner) return;
    dispatch(marcarNotificacionLeida(notificacionBanner.id));
    setIdBanner(null);
    navigate('/notificaciones');
  }

  return (
    <>
      <MarcoMovil>
        <Routes>
          <Route path="/" element={<Bienvenida />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/verificacion-identidad"
            element={<VerificacionIdentidad />}
          />
          <Route
            path="/resultado-verificacion"
            element={<ResultadoVerificacion />}
          />
          <Route
            path="/configuracion-biometria"
            element={<ConfiguracionBiometria />}
          />
          <Route path="/ingreso" element={<Ingreso />} />
          <Route path="/consentimiento" element={<Consentimiento />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/cotizacion" element={<HistorialCotizaciones />} />
          <Route path="/cotizacion/nueva" element={<Cotizacion />} />
          <Route
            path="/resultado-cotizacion"
            element={<ResultadoCotizacion />}
          />
          <Route path="/pago" element={<Pago />} />
          <Route path="/firma-poliza" element={<FirmaPoliza />} />
          <Route
            path="/confirmacion-certificado"
            element={<ConfirmacionCertificado />}
          />
          <Route path="/billetera" element={<Billetera />} />
          <Route path="/detalle-poliza" element={<DetallePoliza />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Routes>
        <BarraNavegacion />
        <BannerPush
          visible={!!notificacionBanner}
          titulo={notificacionBanner ? textoDe(notificacionBanner.tituloClave) : ''}
          cuerpo={notificacionBanner ? textoDe(notificacionBanner.cuerpoClave) : ''}
          etiquetaCerrar={t('comun.cerrar')}
          onPulsar={pulsarBanner}
          onCerrar={() => setIdBanner(null)}
        />
      </MarcoMovil>
      <PanelDepuracion />
    </>
  );
}
