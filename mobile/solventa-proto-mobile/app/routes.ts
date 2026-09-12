import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Dos entradas apuntando al mismo componente porque un splat ("*") en el
// config de archivos NO cubre la raiz exacta "/" (solo rutas con al menos
// un caracter despues de la barra). Sin la entrada index(), "/" quedaba sin
// ningun hijo que renderizar dentro de <Outlet/> en root.tsx: pagina en
// blanco, sin ningun error. Se les da un id explicito porque, por defecto,
// el id sale de la ruta del archivo y ambas entradas usan el mismo archivo.
export default [
  index("routes/app.tsx", { id: "app-raiz" }),
  route("*", "routes/app.tsx", { id: "app-resto" }),
] satisfies RouteConfig;
