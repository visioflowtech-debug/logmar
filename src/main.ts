/**
 * main.ts — Lógica principal de LogMAR Pro
 *
 * Responsabilidades:
 *   - Inicializar el store de estado
 *   - Renderizar la pantalla de prueba (actualizarPantalla)
 *   - Manejar eventos de teclado
 *   - Coordinar el control remoto (PeerJS)
 *   - Verificar licencia antes de cada interacción
 */

import Peer, { type DataConnection } from 'peerjs';
import { calcularTamanoLogMAR, convertirLogMarASnellen } from './chart_logic';
import { CONFIG } from './config';
import { store } from './state';
import { LicenseManager } from './license';

// ─────────────────────────────────────────────────────────────────────────────
// Calibración obligatoria en primer inicio (clínico #7)
// ─────────────────────────────────────────────────────────────────────────────

if (localStorage.getItem('anchoPantallaCm') === null) {
  window.location.replace('/configuracion');
}

// ─────────────────────────────────────────────────────────────────────────────
// Referencias DOM
// ─────────────────────────────────────────────────────────────────────────────

const bodyElement     = document.body;
const infoHud         = document.getElementById('info')!;
const logMarElement   = document.getElementById('info-logmar')!;
const infoHintElement = document.getElementById('info-hint')!;
const snellenElement  = document.getElementById('info-snellen')!;
const modeHintElement = document.getElementById('mode-hint')!;
const etdrsChart      = document.getElementById('etdrs-chart')!;
const etdrsLetrasElements = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
  document.getElementById(`l${n}`)!
);
const duochromeChart   = document.getElementById('duochrome-chart')!;
const duochromeRed     = document.getElementById('red-side')!;
const duochromeGreen   = document.getElementById('green-side')!;
const astigmatismChart = document.getElementById('astigmatism-chart')!;
const worthTest        = document.getElementById('worth-test')!;
const amslerGrid       = document.getElementById('amsler-grid')!;

const modeElements: Record<string, HTMLElement> = {
  'Duo-Cromo':          duochromeChart,
  'Reloj Astigmático':  astigmatismChart,
  'Test de Worth':      worthTest,
  'Rejilla de Amsler':  amslerGrid,
};

// ─────────────────────────────────────────────────────────────────────────────
// Vocabularios de optotipos
// ─────────────────────────────────────────────────────────────────────────────

const SLOAN_LETTERS     = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'];
const NUMBERS_WITH_ZERO = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const LEA_SYMBOLS       = ['A', 'H', 'C', 'S'];
const LIGHTHOUSE_SYMBOLS = ['A', 'H', 'U'];
const MODOS_ESTATICOS   = ['Reloj Astigmático', 'Test de Worth', 'Rejilla de Amsler'];

type LineType = 'LETTERS' | 'NUMBERS' | 'LEA' | 'LIGHTHOUSE';

// ─────────────────────────────────────────────────────────────────────────────
// Caché de aleatorización por sesión (anti-memorización — Ferris 1982)
// Se resetea automáticamente al recargar la página (nueva sesión clínica).
// Clave: `${modo}_${logmar}` → línea aleatoria de 8 optotipos
// ─────────────────────────────────────────────────────────────────────────────

const sessionLines = new Map<string, string>();

function sessionKey(modo: string, logmar: number): string {
  return `${modo}_${logmar.toFixed(1)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG — Símbolos LEA (Hyvärinen 1980 / ISO 8596:2009)
//
// IMPORTANTE CLÍNICO: Los símbolos deben ser SÓLIDOS (silueta negra rellena).
// La versión hollow (contorno) reduce el fenómeno de crowding y sobreestima
// la agudeza visual en pacientes con ambliopía — invalida el screening.
// Fuente: Levi DM. Vision Research. 2008;48(5):635-654.
//         Hyvärinen L. Acta Ophthalmol Scand Suppl. 1996;(219):50-52.
//
// Manzana: silueta corazón-manzana con tallo corto, SIN hoja.
//   El niño puede decir "manzana" o "corazón" — ambas respuestas son correctas
//   en práctica clínica pediátrica (Hyvärinen 1980, p. 509).
// Casa: pentágono sólido SIN recortes internos (sin puerta, sin ventana).
//   Los detalles internos afectan el crowding asimétrico.
// ─────────────────────────────────────────────────────────────────────────────

const LEA_SVG: Record<string, string> = {
  // Manzana (Apple/Heart) — silueta corazón-manzana estándar Hyvärinen
  // Cuerpo: dos lóbulos redondeados con hendidura inferior en V + tallo corto centrado
  A: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <path fill="currentColor"
      d="M50,25 C46,20 36,18 28,22 C14,28 10,42 10,56
         C10,74 20,90 35,90 C42,90 47,86 50,82
         C53,86 58,90 65,90 C80,90 90,74 90,56
         C90,42 86,28 72,22 C64,18 54,20 50,25 Z"/>
    <rect fill="currentColor" x="46" y="10" width="8" height="18" rx="4"/>
  </svg>`,
  // Casa (House) — pentágono sólido, ángulo de apice ~90°, sin recortes
  // Proporción: techo 45% de altura total, base 55% — estándar Good-Lite
  H: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <path fill="currentColor" d="M50,10 L90,55 L90,90 L10,90 L10,55 Z"/>
  </svg>`,
  // Círculo (Circle) — anillo con trazo = 1/5 del diámetro (ISO 8596:2009 sec 4.1)
  // Diámetro exterior = 80% del viewBox (80 u), stroke-width = 16 u (20%)
  C: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <circle fill="none" stroke="currentColor" stroke-width="16" cx="50" cy="50" r="32"/>
  </svg>`,
  // Cuadrado (Square) — marco con trazo = 1/5 del lado (ISO 8596:2009)
  // Lado exterior = 80 u (10→90), stroke centrado en x=18, lado=64
  S: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <rect fill="none" stroke="currentColor" stroke-width="16" x="18" y="18" width="64" height="64"/>
  </svg>`,
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG — Símbolos Lighthouse (Allen 1957 / Good-Lite)
// Siluetas sólidas. Manzana = misma silueta corazón-manzana que LEA.
// Casa = pentágono con puerta centrada recortada (Allen 1957) — SIN ventana lateral.
// Paraguas = cúpula + mango + gancho curvado.
// ─────────────────────────────────────────────────────────────────────────────

const LIGHTHOUSE_SVG: Record<string, string> = {
  // Manzana (Apple/Heart) — misma silueta estándar que LEA (Allen 1957)
  A: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <path fill="currentColor"
      d="M50,25 C46,20 36,18 28,22 C14,28 10,42 10,56
         C10,74 20,90 35,90 C42,90 47,86 50,82
         C53,86 58,90 65,90 C80,90 90,74 90,56
         C90,42 86,28 72,22 C64,18 54,20 50,25 Z"/>
    <rect fill="currentColor" x="46" y="10" width="8" height="18" rx="4"/>
  </svg>`,
  // Casa (House) — pentágono con puerta centrada recortada (Allen 1957)
  // Nota: solo puerta centrada. La ventana lateral NO está en Allen 1957.
  H: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <path fill="currentColor" d="M50,10 L90,55 L90,90 L10,90 L10,55 Z"/>
    <rect fill="white" x="37" y="63" width="26" height="27"/>
  </svg>`,
  // Paraguas (Umbrella) — cúpula semicircular + mango vertical + gancho
  U: `<svg class="optotype-svg" viewBox="0 0 100 100">
    <path fill="currentColor" d="M8,52 C8,23 26,8 50,8 C74,8 92,23 92,52 Z"/>
    <rect fill="currentColor" x="46" y="52" width="8" height="30"/>
    <path fill="currentColor"
      d="M54,82 C62,82 62,90 62,90 C62,96 56,98 50,96
         C46,95 44,92 46,90 L50,90 C52,92 56,91 56,88 C56,86 54,85 54,82 Z"/>
  </svg>`,
};

function renderSymbol(char: string, isLEA: boolean, isLighthouse: boolean): string {
  if (isLEA)        return LEA_SVG[char]        ?? char;
  if (isLighthouse) return LIGHTHOUSE_SVG[char]  ?? char;
  return char;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generación de líneas aleatorias
// ─────────────────────────────────────────────────────────────────────────────

function generateRandomLine(length: number, type: LineType): string {
  const sources: Record<LineType, string[]> = {
    LETTERS:    SLOAN_LETTERS,
    NUMBERS:    NUMBERS_WITH_ZERO,
    LEA:        LEA_SYMBOLS,
    LIGHTHOUSE: LIGHTHOUSE_SYMBOLS,
  };
  const source = sources[type];
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(source[Math.floor(Math.random() * source.length)]!);
  }
  return result.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Cantidad de optotipos por línea
//
// ETDRS/Números: exactamente 5 por línea (Ferris 1982 — "Each line contains
//   5 letters"). Si no caben 5, se muestran los que caben (mínimo 1).
// LEA/Lighthouse: hasta 8 (símbolos pediátricos, aún en revisión clínica).
//
// Con gap=1em: N optotipos ocupan (2N−1)×letterPx píxeles horizontales.
// ─────────────────────────────────────────────────────────────────────────────

function calcularCantidadOptotipos(letterPx: number, maxOptotipos: number): number {
  const available = window.innerWidth * 0.88;
  const maxFit    = Math.floor((available + letterPx) / (2 * letterPx));
  return Math.max(1, Math.min(maxOptotipos, maxFit));
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutaciones de estado
// ─────────────────────────────────────────────────────────────────────────────

function changeLogMarStep(direction: number): void {
  const { valorLogMarActual, settings } = store.state;
  let currentIndex = settings.enabledLogMarValues.findIndex(
    (v) => Math.abs(v - valorLogMarActual) < 0.001,
  );
  if (currentIndex === -1) currentIndex = 0;
  const newIndex = currentIndex - direction;
  if (newIndex >= 0 && newIndex < settings.enabledLogMarValues.length) {
    store.setState({ valorLogMarActual: settings.enabledLogMarValues[newIndex]! });
  }
}

function toggleMirrorMode(): void {
  const isMirrored = !store.state.settings.isMirrored;
  localStorage.setItem('isMirrored', JSON.stringify(isMirrored));
  store.setState({ settings: { ...store.state.settings, isMirrored } });
  bodyElement.classList.toggle('mirrored', isMirrored);
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderizado del test Duo-Cromo
// ─────────────────────────────────────────────────────────────────────────────

function renderDuochrome(): void {
  const { settings } = store.state;
  duochromeRed.innerHTML   = '';
  duochromeGreen.innerHTML = '';

  type LineConfig =
    | { logMar: number; type: 'TARGET'; customScale: number }
    | { logMar: number; type: 'LETTERS'; count: number };

  const linesConfig: LineConfig[] = [
    { logMar: 1.0, type: 'TARGET', customScale: settings.duochromeTargetScale },
  ];

  let currentLogMar = 0.5;
  const letterLinesCount = settings.duochromeLetterLines;

  for (let i = 0; i < letterLinesCount; i++) {
    const letterCount = Math.min(4 + i, 6);
    linesConfig.push({ logMar: currentLogMar, type: 'LETTERS', count: letterCount });
    if (currentLogMar > 0.4)      currentLogMar = 0.3;
    else if (currentLogMar > 0.2) currentLogMar = 0.1;
    else if (currentLogMar > 0.0) currentLogMar = 0.0;
    else                          currentLogMar -= 0.1;
    if (currentLogMar < -0.3) break;
  }

  const redFragment   = document.createDocumentFragment();
  const greenFragment = document.createDocumentFragment();

  linesConfig.forEach((line) => {
    // Aplicar calibrationFactor en Duo-Cromo (consistencia entre modos)
    let fontSizePx = calcularTamanoLogMAR(line.logMar, settings);
    if (line.type === 'TARGET') fontSizePx *= line.customScale;

    const makeContainer = (): HTMLDivElement => {
      const div = document.createElement('div');
      div.style.fontSize      = `${fontSizePx}px`;
      div.style.lineHeight    = '1.5';
      div.style.display       = 'flex';
      div.style.gap           = '1em'; // ISO: espaciado = 1 tamaño de letra (Ferris 1982)
      div.style.justifyContent = 'center';
      return div;
    };

    const redContainer   = makeContainer();
    const greenContainer = makeContainer();

    if (line.type === 'TARGET') {
      const target = document.createElement('div');
      target.className = 'optotype-target';
      redContainer.appendChild(target);
      greenContainer.appendChild(target.cloneNode(true));
    } else {
      const letters = generateRandomLine(line.count, 'LETTERS').split(' ');
      letters.forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        redContainer.appendChild(span);
      });
      [...letters].reverse().forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        greenContainer.appendChild(span);
      });
    }

    redFragment.appendChild(redContainer);
    greenFragment.appendChild(greenContainer);
  });

  duochromeRed.appendChild(redFragment);
  duochromeGreen.appendChild(greenFragment);
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD (cabecera informativa)
// ─────────────────────────────────────────────────────────────────────────────

// Avisos clínicos por modo (clínico #4, #5, #6)
const MODE_HINTS: Record<string, string> = {
  'Duo-Cromo':         'Requiere filtros rojo-verde · Preguntar en cuál lado las letras se ven más nítidas',
  'Test de Worth':     'Paciente usa gafas rojo-verde · OD = filtro rojo, OI = filtro verde',
  'Rejilla de Amsler': 'Distancia: 30 cm · Tape el ojo no dominante · Fijar vista en el punto central',
};

function updateHud(modoActual: string, optotiposCount?: number): void {
  const { valorLogMarActual, settings } = store.state;
  logMarElement.textContent  = `LogMAR: ${valorLogMarActual.toFixed(1)} (${modoActual})`;
  snellenElement.textContent = `Snellen: ${convertirLogMarASnellen(valorLogMarActual)}`;

  // Hint de scoring dinámico según cantidad real de optotipos mostrados (clínico #1/#2/#5)
  const isCartilla = !!settings.CARTILLAS_ETDRS[modoActual]  ||
                     !!settings.CARTILLAS_NUMEROS[modoActual] ||
                     !!settings.CARTILLAS_LEA[modoActual]     ||
                     !!settings.CARTILLAS_LIGHTHOUSE[modoActual];
  if (isCartilla && optotiposCount !== undefined && optotiposCount > 0) {
    const minPass = Math.max(1, Math.ceil(optotiposCount * 0.6));
    infoHintElement.textContent = `${optotiposCount} opt. · mín. ${minPass}/${optotiposCount}`;
  } else {
    infoHintElement.textContent = '';
  }

  // Aviso clínico por modo
  const hint = MODE_HINTS[modoActual];
  if (hint) {
    modeHintElement.textContent = hint;
    modeHintElement.classList.remove('hidden');
  } else {
    modeHintElement.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Escala de contenido (evita overflow horizontal)
// ─────────────────────────────────────────────────────────────────────────────

function adjustContentScale(): void {
  const container = document.getElementById('etdrs-line-content');
  if (!container) return;
  container.style.transform = 'scale(1)';
  const maxWidth = window.innerWidth * 0.9;
  if (container.scrollWidth > maxWidth) {
    container.style.transform = `scale(${maxWidth / container.scrollWidth})`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Función principal de actualización de pantalla
// ─────────────────────────────────────────────────────────────────────────────

function actualizarPantalla(): void {
  const { valorLogMarActual, indiceModoActual, settings, modosDePantalla } = store.state;
  const modoActual = modosDePantalla[indiceModoActual]!;

  const cartillaActiva =
    settings.CARTILLAS_ETDRS[modoActual] ??
    settings.CARTILLAS_NUMEROS[modoActual] ??
    settings.CARTILLAS_LEA[modoActual] ??
    settings.CARTILLAS_LIGHTHOUSE[modoActual];

  const esModoETDRS    = !!cartillaActiva;
  const esPruebaLogMAR = esModoETDRS || modoActual === 'Duo-Cromo';

  bodyElement.classList.toggle('dark-background', modoActual === 'Test de Worth');
  infoHud.classList.toggle('hidden', !esPruebaLogMAR);

  // Ocultar todos los modos
  Object.values(modeElements).forEach((el) => el.classList.add('hidden'));
  etdrsChart.classList.add('hidden');

  // Modo estático (Duo-Cromo, Reloj, Worth, Amsler)
  if (!esModoETDRS && modeElements[modoActual]) {
    modeElements[modoActual]!.classList.remove('hidden');

    // Amsler Grid: tamaño calculado según calibración para 30 cm (Amsler 1953)
    // Área estándar: 2 × 30cm × tan(10°) ≈ 10.58 cm × 10.58 cm = 20° campo central
    if (modoActual === 'Rejilla de Amsler') {
      const pxPerCm     = settings.resolucionAnchoPx / settings.anchoPantallaCm;
      const sizeCm      = 2 * 30 * Math.tan(10 * Math.PI / 180); // ≈ 10.58 cm
      const sizePx      = sizeCm * pxPerCm * settings.calibrationFactor;
      const cellPx      = sizePx / 20; // 20 divisiones = 1° cada una
      amslerGrid.style.width          = `${sizePx}px`;
      amslerGrid.style.height         = `${sizePx}px`;
      amslerGrid.style.backgroundSize = `${cellPx}px ${cellPx}px`;
    }

    if (modoActual === 'Duo-Cromo') renderDuochrome();
    updateHud(modoActual);
    return;
  }

  // Modo ETDRS (cartillas de letras, números, LEA, Lighthouse)
  if (esModoETDRS && cartillaActiva) {
    etdrsChart.classList.remove('hidden');
    const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
    etdrsChart.style.fontSize = `${nuevoTamanoPx}px`;

    const esModoLEA        = !!settings.CARTILLAS_LEA[modoActual];
    const esModoLighthouse = !!settings.CARTILLAS_LIGHTHOUSE[modoActual];
    const esModoSimbolo    = esModoLEA || esModoLighthouse;
    const lineContent      = document.getElementById('etdrs-line-content');
    lineContent?.classList.toggle('lea-mode', esModoSimbolo);

    // Cantidad de optotipos:
    //   ETDRS/Números → máx 5 (estándar Ferris 1982: "Each line contains 5 letters")
    //   LEA/Lighthouse → máx 8 (en revisión clínica)
    const maxOptotipos = esModoSimbolo ? 8 : 5;
    const count = calcularCantidadOptotipos(nuevoTamanoPx, maxOptotipos);

    // Selección de línea:
    //   ETDRS/Números → secuencia fija indexada por posición en POSSIBLE_LOGMAR_VALUES
    //   LEA/Lighthouse → aleatorización por sesión (símbolos en revisión)
    let lineText: string;
    if (esModoSimbolo) {
      const key = sessionKey(modoActual, valorLogMarActual);
      if (!sessionLines.has(key)) {
        const tipo: LineType = esModoLEA ? 'LEA' : 'LIGHTHOUSE';
        sessionLines.set(key, generateRandomLine(8, tipo));
      }
      lineText = sessionLines.get(key)!;
    } else {
      // Lookup fijo: el índice en POSSIBLE_LOGMAR_VALUES corresponde al índice del array
      const lineIndex = CONFIG.POSSIBLE_LOGMAR_VALUES.findIndex(
        (v) => Math.abs(v - valorLogMarActual) < 0.001,
      );
      lineText = (lineIndex >= 0 ? cartillaActiva[lineIndex] : undefined) ?? 'D H S R N';
    }

    const items = lineText.split(' ');

    // Ocultar todos los slots
    etdrsLetrasElements.forEach((el) => (el.style.display = 'none'));

    // Mostrar los primeros `count` optotipos
    for (let i = 0; i < count; i++) {
      const el   = etdrsLetrasElements[i];
      const char = items[i];
      if (char && el) {
        el.innerHTML = (esModoLEA || esModoLighthouse)
          ? renderSymbol(char, esModoLEA, esModoLighthouse)
          : char;
        el.style.display = 'inline';
      }
    }

    requestAnimationFrame(adjustContentScale);
    updateHud(modoActual, count);
    return;
  }

  updateHud(modoActual);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suscripción: cualquier cambio en el store → renderizar
// ─────────────────────────────────────────────────────────────────────────────

store.subscribe(actualizarPantalla);

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard handler
// ─────────────────────────────────────────────────────────────────────────────

const KEY = {
  UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight',
  RANDOMIZE: 'r', MIRROR: 'm',
} as const;

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (!LicenseManager.isActivated()) return;

  const { indiceModoActual, settings, modosDePantalla, valorLogMarActual } = store.state;
  const currentMode = modosDePantalla[indiceModoActual]!;

  // Modo espejo
  if (event.key.toLowerCase() === KEY.MIRROR) {
    toggleMirrorMode();
    return;
  }

  // Re-aleatorización manual — solo para LEA y Lighthouse (símbolos en revisión).
  // ETDRS y Números usan secuencias fijas (no aleatorias) — R no tiene efecto en ellos.
  if (event.key.toLowerCase() === KEY.RANDOMIZE) {
    const isSimbolo =
      !!settings.CARTILLAS_LEA[currentMode] ||
      !!settings.CARTILLAS_LIGHTHOUSE[currentMode];
    if (isSimbolo) {
      sessionLines.delete(sessionKey(currentMode, valorLogMarActual));
      store.setState({ randomizedLines: {} });
      return;
    }
  }

  // Navegación de tamaño — bloqueada en modos estáticos y Duo-Cromo
  if (MODOS_ESTATICOS.includes(currentMode) &&
    (event.key === KEY.UP || event.key === KEY.DOWN)) return;
  if (currentMode === 'Duo-Cromo' &&
    (event.key === KEY.UP || event.key === KEY.DOWN)) return;

  switch (event.key) {
    case KEY.UP:
      changeLogMarStep(1);
      break;
    case KEY.DOWN:
      changeLogMarStep(-1);
      break;
    case KEY.RIGHT: {
      const nextIndex = (indiceModoActual + 1) % modosDePantalla.length;
      store.setState({ indiceModoActual: nextIndex, randomizedLines: {} });
      break;
    }
    case KEY.LEFT: {
      const prevIndex = (indiceModoActual - 1 + modosDePantalla.length) % modosDePantalla.length;
      store.setState({ indiceModoActual: prevIndex, randomizedLines: {} });
      break;
    }
  }

  // Resetear LogMAR al entrar en Duo-Cromo
  const newMode = store.state.modosDePantalla[store.state.indiceModoActual]!;
  if (newMode === 'Duo-Cromo' && currentMode !== 'Duo-Cromo') {
    store.setState({ valorLogMarActual: settings.duochromeInitialLogMar });
  }
});

window.addEventListener('resize', () => {
  adjustContentScale();
  actualizarPantalla();
});

// Cuando el browser restaura la página desde bfcache (botón Atrás),
// el store ya inicializado no re-lee localStorage. Forzar recarga limpia.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

// ─────────────────────────────────────────────────────────────────────────────
// Control Remoto (PeerJS)
// ─────────────────────────────────────────────────────────────────────────────

const RemoteControl = {
  peer: null as Peer | null,
  conn: null as DataConnection | null,
  hostId: '',

  generateShortId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  },

  setup(): void {
    this.hostId = this.generateShortId();

    const remoteLink      = document.getElementById('remote-link');
    const remoteModal     = document.getElementById('remote-modal');
    const closeBtn        = document.getElementById('close-remote-modal');
    const remoteIdDisplay = document.getElementById('remote-id-display');
    const remoteUrlDisplay = document.getElementById('remote-url-display');
    const remoteQr        = document.getElementById('remote-qr') as HTMLImageElement | null;

    if (!remoteLink || !remoteModal) return;

    remoteLink.addEventListener('click', () => {
      this.startHost();
      remoteModal.classList.remove('hidden');
      remoteModal.style.display = 'flex';
      if (remoteIdDisplay) remoteIdDisplay.textContent = this.hostId;
      const currentUrl =
        window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/remote';
      if (remoteUrlDisplay) remoteUrlDisplay.textContent = currentUrl;
      if (remoteQr) {
        remoteQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
      }
    });

    closeBtn?.addEventListener('click', () => {
      remoteModal.classList.add('hidden');
      remoteModal.style.display = 'none';
    });
  },

  startHost(): void {
    if (this.peer) return;
    const fullId = `logmar-app-${this.hostId}`;
    this.peer = new Peer(fullId, { debug: 2 });

    this.peer.on('connection', (conn: DataConnection) => {
      this.conn = conn;
      const modal = document.getElementById('remote-modal');
      if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
      conn.on('data', (data: unknown) =>
        this.handleCommand(data as { action: string; value?: string | null }));
    });

    this.peer.on('error', (err: Error & { type?: string }) => {
      console.error('PeerJS Error:', err);
      if (err.type === 'unavailable-id') {
        this.hostId = this.generateShortId();
        this.peer   = null;
        this.startHost();
      }
    });
  },

  handleCommand(data: { action: string; value?: string | null }): void {
    if (!LicenseManager.isActivated()) return;

    const { indiceModoActual, modosDePantalla, settings, valorLogMarActual } = store.state;
    const currentMode = modosDePantalla[indiceModoActual]!;

    if (currentMode === 'Duo-Cromo' &&
      ['increase_size', 'decrease_size', 'reset_size'].includes(data.action)) return;

    switch (data.action) {
      case 'increase_size':
        changeLogMarStep(1);
        break;
      case 'decrease_size':
        changeLogMarStep(-1);
        break;
      case 'reset_size': {
        const lettersIndex = modosDePantalla.findIndex((m) => m.includes('Cartilla 1'));
        store.setState({
          indiceModoActual: lettersIndex !== -1 ? lettersIndex : 0,
          valorLogMarActual: 1.0,
          randomizedLines: {},
        });
        break;
      }
      case 'next_optotype':
        store.setState({
          indiceModoActual: (indiceModoActual + 1) % modosDePantalla.length,
          randomizedLines: {},
        });
        break;
      case 'prev_optotype':
        store.setState({
          indiceModoActual: (indiceModoActual - 1 + modosDePantalla.length) % modosDePantalla.length,
          randomizedLines: {},
        });
        break;
      case 'randomize': {
        // Aleatorización manual vía remoto — incluye LEA y Lighthouse (clínico #4)
        const isCartilla =
          !!settings.CARTILLAS_ETDRS[currentMode]      ||
          !!settings.CARTILLAS_NUMEROS[currentMode]     ||
          !!settings.CARTILLAS_LEA[currentMode]         ||
          !!settings.CARTILLAS_LIGHTHOUSE[currentMode];
        if (isCartilla) {
          sessionLines.delete(sessionKey(currentMode, valorLogMarActual));
          store.setState({ randomizedLines: {} });
        }
        break;
      }
      case 'toggle_mirror':
        toggleMirrorMode();
        break;
      case 'toggle_red_green': {
        const duoIndex = modosDePantalla.indexOf('Duo-Cromo');
        if (duoIndex !== -1) {
          if (indiceModoActual === duoIndex) {
            store.setState({ indiceModoActual: 0, randomizedLines: {} });
          } else {
            store.setState({
              indiceModoActual: duoIndex,
              valorLogMarActual: settings.duochromeInitialLogMar,
              randomizedLines: {},
            });
          }
        }
        break;
      }
      case 'set_type':
        if (data.value) this.setOptotypeByType(data.value);
        break;
      case 'set_mode':
        if (data.value) this.setMode(data.value);
        break;
    }
  },

  setMode(modeName: string): void {
    const { modosDePantalla } = store.state;
    let index = modosDePantalla.indexOf(modeName);
    if (index === -1) {
      index = modosDePantalla.findIndex(
        (m) => m.includes(modeName) || modeName.includes(m),
      );
    }
    if (index !== -1) {
      store.setState({ indiceModoActual: index, randomizedLines: {} });
    }
  },

  setOptotypeByType(type: string): void {
    const { modosDePantalla } = store.state;
    const typeMap: Record<string, string> = {
      sloan:      'Cartilla 1',
      numbers:    'Numeros 1',
      lea:        'LEA',
      lighthouse: 'Lighthouse',
    };
    const targetName = typeMap[type];
    if (!targetName) return;
    const index = modosDePantalla.findIndex((m) => m.includes(targetName));
    if (index !== -1) {
      store.setState({ indiceModoActual: index, randomizedLines: {} });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inicialización
// ─────────────────────────────────────────────────────────────────────────────

if (store.state.settings.isMirrored) {
  bodyElement.classList.add('mirrored');
}

LicenseManager.init();
RemoteControl.init();
actualizarPantalla();
