import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Prototipo sin backend: se sirve como SPA pura, todo el estado es local.
  ssr: false,
} satisfies Config;
