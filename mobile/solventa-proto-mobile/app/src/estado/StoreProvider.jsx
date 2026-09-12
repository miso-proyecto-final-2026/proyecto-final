import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { estadoInicial } from './estadoInicial';
import { reducer } from './reducer';

const CLAVE_PREFERENCIAS = 'solventa.preferencias';

const ContextoEstado = createContext(null);
const ContextoDispatch = createContext(null);

/** Recupera preferencias guardadas para que sobrevivan a un refresco. */
function cargarEstadoInicial(base) {
  try {
    const guardado = window.localStorage.getItem(CLAVE_PREFERENCIAS);
    if (!guardado) return base;
    return { ...base, preferencias: { ...base.preferencias, ...JSON.parse(guardado) } };
  } catch {
    return base;
  }
}

export function StoreProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial, cargarEstadoInicial);

  // Persistir solo preferencias. El resto se pierde al refrescar, y está bien:
  // cada sesión de usabilidad debe empezar limpia.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        CLAVE_PREFERENCIAS,
        JSON.stringify(estado.preferencias)
      );
    } catch {
      /* modo privado o almacenamiento lleno: se ignora */
    }
  }, [estado.preferencias]);

  // Accesibilidad e i18n a nivel de documento.
  useEffect(() => {
    document.documentElement.lang = estado.preferencias.idioma;
    document.body.dataset.tamanoTexto = estado.preferencias.tamanoTexto;
  }, [estado.preferencias.idioma, estado.preferencias.tamanoTexto]);

  return (
    <ContextoDispatch.Provider value={dispatch}>
      <ContextoEstado.Provider value={estado}>{children}</ContextoEstado.Provider>
    </ContextoDispatch.Provider>
  );
}

export function useEstado() {
  const ctx = useContext(ContextoEstado);
  if (ctx === null) throw new Error('useEstado debe usarse dentro de <StoreProvider>');
  return ctx;
}

export function useDispatch() {
  const ctx = useContext(ContextoDispatch);
  if (ctx === null) throw new Error('useDispatch debe usarse dentro de <StoreProvider>');
  return ctx;
}

export default StoreProvider;
