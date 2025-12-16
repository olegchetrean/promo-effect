/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // add other VITE_ vars here as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
