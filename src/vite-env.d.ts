/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly ACCOUNTS_SCRIPT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
