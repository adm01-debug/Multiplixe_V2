/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dominio publico do site (canonical/OG). Opcional: usa o dominio de producao como padrao. */
  readonly VITE_SITE_URL?: string;
}
