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
import { store } from './state';
import { LicenseManager } from './license';

// ─────────────────────────────────────────────────────────────────────────────
// Referencias DOM
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Calibración obligatoria en primer inicio (clínico #7)
// Si el usuario nunca ha configurado la pantalla, redirigir a calibración.
// ─────────────────────────────────────────────────────────────────────────────

if (localStorage.getItem('anchoPantallaCm') === null) {
  window.location.replace('/configuracion');
}

const bodyElement = document.body;
const infoHud        = document.getElementById('info')!;
const logMarElement  = document.getElementById('info-logmar')!;
const infoHintElement = document.getElementById('info-hint')!;
const snellenElement = document.getElementById('info-snellen')!;
const modeHintElement = document.getElementById('mode-hint')!;
const etdrsChart     = document.getElementById('etdrs-chart')!;
const etdrsLetrasElements = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
  document.getElementById(`l${n}`)!
);
const duochromeChart  = document.getElementById('duochrome-chart')!;
const duochromeRed    = document.getElementById('red-side')!;
const duochromeGreen  = document.getElementById('green-side')!;
const astigmatismChart = document.getElementById('astigmatism-chart')!;
const worthTest       = document.getElementById('worth-test')!;
const amslerGrid      = document.getElementById('amsler-grid')!;

const modeElements: Record<string, HTMLElement> = {
  'Duo-Cromo':          duochromeChart,
  'Reloj Astigmático':  astigmatismChart,
  'Test de Worth':      worthTest,
  'Rejilla de Amsler':  amslerGrid,
};

const etdrsDisplayRules: Record<string, [number, number]> = {
  '1.0': [1, 2],
  '0.9': [2, 1], '0.8': [2, 1], '0.7': [2, 1],
  '0.6': [3, 1],
  '0.5': [4, 0],
  '0.4': [5, 0], '0.3': [5, 0],
  '0.2': [6, 0],
  '0.1': [7, 0],
  '0.0': [8, 0], '-0.1': [8, 0], '-0.2': [8, 0], '-0.3': [8, 0],
};

const SLOAN_LETTERS    = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'];
const NUMBERS_WITH_ZERO = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MODOS_ESTATICOS  = ['Reloj Astigmático', 'Test de Worth', 'Rejilla de Amsler'];

// ─────────────────────────────────────────────────────────────────────────────
// Renderizado de símbolos SVG (LEA y Lighthouse)
// ─────────────────────────────────────────────────────────────────────────────

const LEA_SVG: Record<string, string> = {
  A: `<svg class="optotype-svg" viewBox="0 0 100 100"><path fill="currentColor" d="M50,30 C65,10 90,20 90,52 C90,80 70,92 50,92 C30,92 10,80 10,52 C10,20 35,10 50,30 Z"/></svg>`,
  H: `<svg class="optotype-svg" viewBox="0 0 100 100"><path fill="currentColor" d="M15,90 V45 L50,12 L85,45 V90 Z"/></svg>`,
  C: `<svg class="optotype-svg" viewBox="0 0 100 100"><circle fill="currentColor" cx="50" cy="50" r="42"/></svg>`,
  S: `<svg class="optotype-svg" viewBox="0 0 100 100"><rect fill="currentColor" x="10" y="10" width="80" height="80"/></svg>`,
};

const LIGHTHOUSE_SVG: Record<string, string> = {
  A: `<svg class="optotype-svg" viewBox="0 0 100 100"><path fill="currentColor" d="M50,30 C65,10 90,20 90,50 C90,75 70,90 50,90 C30,90 10,75 10,50 C10,20 35,10 50,30 Z"/></svg>`,
  H: `<svg class="optotype-svg" viewBox="0 0 100 100"><path fill="currentColor" d="M15,90 V45 L50,12 L85,45 V90 Z M55,75 V55 H45 V75 Z" fill-rule="evenodd"/></svg>`,
  U: `<svg class="optotype-svg" viewBox="4 4 92 92"><path fill="currentColor" d="M50,15 C30,15 15,35 15,55 L85,55 C85,35 70,15 50,15 Z"/><rect fill="currentColor" x="47" y="55" width="6" height="25" rx="3"/></svg>`,
};

function renderSymbol(char: string, isLEA: boolean, isLighthouse: boolean): string {
  if (isLEA)        return LEA_SVG[char]        ?? char;
  if (isLighthouse) return LIGHTHOUSE_SVG[char]  ?? char;
  return char;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de generación de líneas
// ─────────────────────────────────────────────────────────────────────────────

function generateRandomLine(length: number, type: 'LETTERS' | 'NUMBERS'): string {
  const source = type === 'NUMBERS' ? NUMBERS_WITH_ZERO : SLOAN_LETTERS;
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(source[Math.floor(Math.random() * source.length)]!);
  }
  return result.join(' ');
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
  duochromeRed.innerHTML = '';
  duochromeGreen.innerHTML = '';

  type LineConfig =
    | { logMar: number; type: 'TARGET'; customScale: number }
    | { logMar: number; type: 'LETTERS'; count: number };

  const linesConfig: LineConfig[] = [
    { logMar: 0.7, type: 'TARGET', customScale: settings.duochromeTargetScale },
  ];

  let currentLogMar = 0.5;
  const letterLinesCount = settings.duochromeLetterLines;

  for (let i = 0; i < letterLinesCount; i++) {
    let letterCount = Math.min(4 + i, 6);
    linesConfig.push({ logMar: currentLogMar, type: 'LETTERS', count: letterCount });
    if (currentLogMar > 0.4)       currentLogMar = 0.3;
    else if (currentLogMar > 0.2)  currentLogMar = 0.1;
    else if (currentLogMar > 0.0)  currentLogMar = 0.0;
    else                           currentLogMar -= 0.1;
    if (currentLogMar < -0.3) break;
  }

  const redFragment  = document.createDocumentFragment();
  const greenFragment = document.createDocumentFragment();
  const settingsSinCalibracion = { ...settings, calibrationFactor: 1.0 };

  linesConfig.forEach((line) => {
    let fontSizePx = calcularTamanoLogMAR(line.logMar, settingsSinCalibracion);
    if (line.type === 'TARGET') fontSizePx *= line.customScale;

    const makeContainer = (): HTMLDivElement => {
      const div = document.createElement('div');
      div.style.fontSize     = `${fontSizePx}px`;
      div.style.lineHeight   = '1.5';
      div.style.display      = 'flex';
      div.style.gap          = '0.5em';
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

function updateHud(modoActual: string): void {
  const { valorLogMarActual, settings } = store.state;
  logMarElement.textContent  = `LogMAR: ${valorLogMarActual.toFixed(1)} (${modoActual})`;
  snellenElement.textContent = `Snellen: ${convertirLogMarASnellen(valorLogMarActual)}`;

  // Hint de scoring: variante 8-optotipos (clínico #1/#2)
  const isCartilla = !!settings.CARTILLAS_ETDRS[modoActual]  ||
                     !!settings.CARTILLAS_NUMEROS[modoActual] ||
                     !!settings.CARTILLAS_LEA[modoActual]     ||
                     !!settings.CARTILLAS_LIGHTHOUSE[modoActual];
  infoHintElement.textContent = isCartilla ? '8 opt. · mín. 4/8' : '';

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
  const { valorLogMarActual, indiceModoActual, settings, modosDePantalla, randomizedLines } =
    store.state;
  const modoActual = modosDePantalla[indiceModoActual]!;

  const cartillaActiva =
    settings.CARTILLAS_ETDRS[modoActual] ??
    settings.CARTILLAS_NUMEROS[modoActual] ??
    settings.CARTILLAS_LEA[modoActual] ??
    settings.CARTILLAS_LIGHTHOUSE[modoActual];

  const esModoETDRS   = !!cartillaActiva;
  const esPruebaLogMAR = esModoETDRS || modoActual === 'Duo-Cromo';

  bodyElement.classList.toggle('dark-background', modoActual === 'Test de Worth');
  infoHud.classList.toggle('hidden', !esPruebaLogMAR);

  // Ocultar todos los modos
  Object.values(modeElements).forEach((el) => el.classList.add('hidden'));
  etdrsChart.classList.add('hidden');

  if (!esModoETDRS && modeElements[modoActual]) {
    modeElements[modoActual]!.classList.remove('hidden');
    if (modoActual === 'Duo-Cromo') renderDuochrome();
    updateHud(modoActual);
    return;
  }

  if (esModoETDRS && cartillaActiva) {
    etdrsChart.classList.remove('hidden');
    const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
    etdrsChart.style.fontSize = `${nuevoTamanoPx}px`;

    const esModoLEA        = !!settings.CARTILLAS_LEA[modoActual];
    const esModoLighthouse = !!settings.CARTILLAS_LIGHTHOUSE[modoActual];
    const lineContent      = document.getElementById('etdrs-line-content');
    lineContent?.classList.toggle('lea-mode', esModoLEA || esModoLighthouse);

    // Selección de línea
    let indiceDeLinea = Math.round(10 - valorLogMarActual * 10);
    indiceDeLinea = Math.max(0, Math.min(cartillaActiva.length - 1, indiceDeLinea));

    const lineText =
      randomizedLines[valorLogMarActual.toFixed(1)] ?? cartillaActiva[indiceDeLinea]!;
    const items = lineText.split(' ');

    // Ocultar todos los slots
    etdrsLetrasElements.forEach((el) => (el.style.display = 'none'));

    const rule = etdrsDisplayRules[valorLogMarActual.toFixed(1)] ??
      (valorLogMarActual < 0.1 ? [8, 0] : [5, 0]) as [number, number];
    const [count, start] = rule;

    for (let i = 0; i < count; i++) {
      const itemIndex = start + i;
      const el = etdrsLetrasElements[itemIndex];
      const char = items[itemIndex];
      if (char && el) {
        el.innerHTML = (esModoLEA || esModoLighthouse)
          ? renderSymbol(char, esModoLEA, esModoLighthouse)
          : char;
        el.style.display = 'inline';
      }
    }
  }

  requestAnimationFrame(adjustContentScale);
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

  const { indiceModoActual, settings, modosDePantalla, randomizedLines, valorLogMarActual } =
    store.state;
  const currentMode = modosDePantalla[indiceModoActual]!;

  // Modo espejo
  if (event.key.toLowerCase() === KEY.MIRROR) {
    toggleMirrorMode();
    return;
  }

  // Aleatorización (solo en modos de texto/números)
  if (event.key.toLowerCase() === KEY.RANDOMIZE) {
    const esModoETDRS   = !!settings.CARTILLAS_ETDRS[currentMode];
    const esModoNumeros = !!settings.CARTILLAS_NUMEROS[currentMode];
    if (esModoETDRS || esModoNumeros) {
      const newLine = generateRandomLine(8, esModoNumeros ? 'NUMBERS' : 'LETTERS');
      store.setState({
        randomizedLines: { ...randomizedLines, [valorLogMarActual.toFixed(1)]: newLine },
      });
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

window.addEventListener('resize', adjustContentScale);

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

    const remoteLink     = document.getElementById('remote-link');
    const remoteModal    = document.getElementById('remote-modal');
    const closeBtn       = document.getElementById('close-remote-modal');
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
      conn.on('data', (data: unknown) => this.handleCommand(data as { action: string; value?: string | null }));
    });

    this.peer.on('error', (err: Error & { type?: string }) => {
      console.error('PeerJS Error:', err);
      if (err.type === 'unavailable-id') {
        this.hostId = this.generateShortId();
        this.peer = null;
        this.startHost();
      }
    });
  },

  handleCommand(data: { action: string; value?: string | null }): void {
    if (!LicenseManager.isActivated()) return;

    const { indiceModoActual, modosDePantalla, settings, randomizedLines, valorLogMarActual } =
      store.state;
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
        const esModoNumeros = !!settings.CARTILLAS_NUMEROS[currentMode];
        const esModoETDRS   = !!settings.CARTILLAS_ETDRS[currentMode];
        if (esModoETDRS || esModoNumeros) {
          const newLine = generateRandomLine(8, esModoNumeros ? 'NUMBERS' : 'LETTERS');
          store.setState({
            randomizedLines: { ...randomizedLines, [valorLogMarActual.toFixed(1)]: newLine },
          });
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
      sloan: 'Cartilla 1', numbers: 'Numeros 1',
      lea: 'LEA', lighthouse: 'Lighthouse',
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

// Aplicar modo espejo si estaba activo
if (store.state.settings.isMirrored) {
  bodyElement.classList.add('mirrored');
}

// Inicializar licencia y control remoto
LicenseManager.init();
RemoteControl.init();

// Renderizado inicial (el store no dispara sin un setState)
actualizarPantalla();
