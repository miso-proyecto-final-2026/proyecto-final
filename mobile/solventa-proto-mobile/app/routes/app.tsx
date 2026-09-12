import { Route, Routes } from 'react-router';

import MarcoMovil from '~/src/componentes/MarcoMovil';
import BarraNavegacion from '~/src/componentes/BarraNavegacion';
import PanelDepuracion from '~/src/componentes/PanelDepuracion';

import Bienvenida from '~/src/pantallas/Bienvenida';
import Registro from '~/src/pantallas/Registro';
import VerificacionIdentidad from '~/src/pantallas/VerificacionIdentidad';
import ResultadoVerificacion from '~/src/pantallas/ResultadoVerificacion';
import ConfiguracionBiometria from '~/src/pantallas/ConfiguracionBiometria';
import IngresoBiometrico from '~/src/pantallas/IngresoBiometrico';
import Consentimiento from '~/src/pantallas/Consentimiento';
import Inicio from '~/src/pantallas/Inicio';
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
// las 17 rutas de pantalla con <Routes>/<Route> clasicos de react-router.
//
// IMPORTANTE: no envolver esto en <BrowserRouter>. El modo framework de
// React Router v8 ya provee un unico Router (via RouterProvider, generado
// por app/routes.ts); <Routes>/<Route>/useNavigate/<Navigate> solo necesitan
// encontrar ese Router ambiente, no crear uno nuevo. Anidar <BrowserRouter>
// aqui produce "You cannot render a <Router> inside another <Router>".
export default function AppRoutes() {
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
          <Route path="/ingreso-biometrico" element={<IngresoBiometrico />} />
          <Route path="/consentimiento" element={<Consentimiento />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/cotizacion" element={<Cotizacion />} />
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
      </MarcoMovil>
      <PanelDepuracion />
    </>
  );
}
