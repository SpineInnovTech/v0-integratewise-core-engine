/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_URL?: string;
  readonly VITE_SPINE_PROVIDER?: string;
  readonly VITE_STREAM_URL?: string;
  readonly VITE_TWIN_OWUI_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
