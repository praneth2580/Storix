/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly ACCOUNTS_SCRIPT_ID?: string
    readonly VITE_GOOGLE_CLIENT_ID?: string
    readonly BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
