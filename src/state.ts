/**
 * state.ts — Store centralizado de estado de LogMAR Pro
 *
 * Reemplaza las 70+ variables globales de main.js con un único objeto
 * de estado tipado con patrón pub/sub simple.
 *
 * Uso:
 *   import { store } from './state';
 *   const { valorLogMarActual, settings } = store.state;
 *   store.setState({ valorLogMarActual: 0.5 });
 *   const unsub = store.subscribe(() => renderUI());
 */

import type { AppState, AppSettings } from './types';
import { CONFIG } from './config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de persistencia
// ─────────────────────────────────────────────────────────────────────────────

function safeJsonParse<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function readFloat(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? fallback : parsed;
}

function readInt(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modos de pantalla disponibles
// ─────────────────────────────────────────────────────────────────────────────

/** Tests estáticos que no provienen de cartillas de optotipos */
const MODOS_FIJOS = [
  'Duo-Cromo',
  'Reloj Astigmático',
  'Test de Worth',
  'Rejilla de Amsler',
  'Punto de Fijación',
];

/**
 * Listado completo de modos de la app (cartillas + tests fijos), sin filtrar.
 * Fuente única para la pantalla principal y para los checkboxes de configuración.
 */
export function construirTodosLosModos(): string[] {
  return [
    ...Object.keys(CONFIG.CARTILLAS_ETDRS),
    ...Object.keys(CONFIG.CARTILLAS_E_TUMBLING),
    ...Object.keys(CONFIG.CARTILLAS_NUMEROS),
    ...Object.keys(CONFIG.CARTILLAS_LEA),
    ...MODOS_FIJOS,
  ];
}

/**
 * Modos ocultos por el usuario (configuración → "Cartillas y Tests Visibles").
 * Se persiste la lista de OCULTOS (no la de visibles) para que cualquier
 * cartilla nueva agregada en versiones futuras aparezca visible por defecto.
 */
export function leerModosOcultos(): string[] {
  return safeJsonParse<string[]>('hiddenModes', []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Construcción del estado inicial
// ─────────────────────────────────────────────────────────────────────────────

function buildInitialSettings(): AppSettings {
  return {
    anchoPantallaCm:       readFloat('anchoPantallaCm',       CONFIG.anchoPantallaCm),
    resolucionAnchoPx:     readFloat('resolucionAnchoPx',     CONFIG.resolucionAnchoPx),
    distanciaMetros:       readFloat('distanciaMetros',       CONFIG.distanciaMetros),
    valorLogMarInicial:    readFloat('valorLogMarInicial',    CONFIG.valorLogMarInicial),
    duochromeInitialLogMar:readFloat('duochromeInitialLogMar',CONFIG.duochromeInitialLogMar),
    pasoLogMar:            CONFIG.pasoLogMar,
    calibrationFactor:     readFloat('calibrationFactor',     CONFIG.calibrationFactor),
    duochromeTargetScale:  readFloat('duochromeTargetScale',  CONFIG.duochromeTargetScale),
    duochromeLetterLines:  readInt('duochromeLetterLines',    CONFIG.duochromeLetterLines),
    enabledLogMarValues:   safeJsonParse<number[]>('enabledLogMarValues', [...CONFIG.DEFAULT_ENABLED_LOGMAR]),
    isMirrored:            safeJsonParse<boolean>('isMirrored', false),
    CARTILLAS_ETDRS:       { ...CONFIG.CARTILLAS_ETDRS },
    CARTILLAS_E_TUMBLING:  { ...CONFIG.CARTILLAS_E_TUMBLING },
    CARTILLAS_NUMEROS:     { ...CONFIG.CARTILLAS_NUMEROS },
    CARTILLAS_LEA:         { ...CONFIG.CARTILLAS_LEA },
    DUOCHROME_LETTERS:     CONFIG.DUOCHROME_LETTERS,
  };
}

function buildInitialState(): AppState {
  const settings = buildInitialSettings();

  // Filtrar los modos que el usuario ocultó en configuración.
  // Si el filtro dejara la lista vacía, se ignora (la navegación cíclica
  // por índice requiere al menos un modo).
  const todosLosModos = construirTodosLosModos();
  const ocultos       = new Set(leerModosOcultos());
  let modosDePantalla = todosLosModos.filter((m) => !ocultos.has(m));
  if (modosDePantalla.length === 0) modosDePantalla = todosLosModos;

  let valorLogMarActual = settings.valorLogMarInicial;
  if (!settings.enabledLogMarValues.includes(valorLogMarActual)) {
    valorLogMarActual = settings.enabledLogMarValues[0] ?? 0.0;
  }

  return {
    settings,
    valorLogMarActual,
    indiceModoActual: 0,
    randomizedLines: {},
    modosDePantalla,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

type Listener = () => void;

class AppStore {
  private _state: AppState;
  private _listeners: Listener[] = [];

  constructor() {
    this._state = buildInitialState();
  }

  /** Estado actual (solo lectura) */
  get state(): Readonly<AppState> {
    return this._state;
  }

  /**
   * Actualiza campos del estado y notifica a los suscriptores.
   * Utilizar actualizaciones parciales: `store.setState({ valorLogMarActual: 0.5 })`
   */
  setState(partial: Partial<AppState>): void {
    this._state = { ...this._state, ...partial };
    this._listeners.forEach((l) => l());
  }

  /**
   * Suscribirse a cambios de estado.
   * Retorna una función `unsubscribe` para limpiar la suscripción.
   */
  subscribe(listener: Listener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }
}

/** Singleton — única instancia del store para toda la aplicación */
export const store = new AppStore();
