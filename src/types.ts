/**
 * types.ts — Definiciones de tipos de LogMAR Pro
 *
 * Todos los tipos de dominio de la aplicación están aquí.
 * Importar desde este módulo para garantizar consistencia de tipos en todo el proyecto.
 */

/** Configuración física de pantalla — proviene de calibración del usuario */
export interface ScreenConfig {
  anchoPantallaCm: number;
  resolucionAnchoPx: number;
  distanciaMetros: number;
  calibrationFactor: number;
}

/** Configuración completa de la sesión (CONFIG + valores persistidos en localStorage) */
export interface AppSettings extends ScreenConfig {
  valorLogMarInicial: number;
  duochromeInitialLogMar: number;
  pasoLogMar: number;
  enabledLogMarValues: number[];
  isMirrored: boolean;
  duochromeTargetScale: number;
  duochromeLetterLines: number;
  CARTILLAS_ETDRS: Record<string, string[]>;
  CARTILLAS_NUMEROS: Record<string, string[]>;
  CARTILLAS_LEA: Record<string, string[]>;
  DUOCHROME_LETTERS: string;
}

/** Estado dinámico de la sesión de examen */
export interface AppState {
  settings: AppSettings;
  valorLogMarActual: number;
  indiceModoActual: number;
  randomizedLines: Record<string, string>;
  modosDePantalla: string[];
}

/** Comando recibido por el control remoto (PeerJS) */
export interface RemoteCommand {
  action: string;
  value?: string | null;
}

/** Token de licencia decodificado almacenado en localStorage */
export interface LicenseToken {
  k: string;   // Primeros 8 caracteres de la clave (referencia)
  e: number;   // Timestamp de expiración (ms)
  s: string;   // Firma HMAC-SHA256
}
