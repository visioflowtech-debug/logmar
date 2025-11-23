// En: main.js

// --- ¡¡NUEVO!! Objeto de Configuración "Vivo" ---
const settings = {
    anchoPantallaCm: parseFloat(localStorage.getItem('anchoPantallaCm') || CONFIG.anchoPantallaCm),
    resolucionAnchoPx: parseFloat(localStorage.getItem('resolucionAnchoPx') || CONFIG.resolucionAnchoPx),
    distanciaMetros: parseFloat(localStorage.getItem('distanciaMetros') || CONFIG.distanciaMetros),
    valorLogMarInicial: parseFloat(localStorage.getItem('valorLogMarInicial') || CONFIG.valorLogMarInicial),
    duochromeInitialLogMar: parseFloat(localStorage.getItem('duochromeInitialLogMar') || CONFIG.duochromeInitialLogMar),
    pasoLogMar: CONFIG.pasoLogMar,
    calibrationFactor: parseFloat(localStorage.getItem('calibrationFactor') || CONFIG.calibrationFactor),
    enabledLogMarValues: JSON.parse(localStorage.getItem('enabledLogMarValues')) || CONFIG.DEFAULT_ENABLED_LOGMAR,
    CARTILLAS_ETDRS: CONFIG.CARTILLAS_ETDRS,
    CARTILLAS_NUMEROS: CONFIG.CARTILLAS_NUMEROS,
    DUOCHROME_LETTERS: CONFIG.DUOCHROME_LETTERS,

    // --- Configuración de Espejo ---
    isMirrored: JSON.parse(localStorage.getItem('isMirrored')) || false
};

// --- 1. VARIABLES DE ESTADO Y REFERENCIAS AL DOM ---
let valorLogMarActual = settings.valorLogMarInicial;
if (!settings.enabledLogMarValues.includes(valorLogMarActual)) {
    valorLogMarActual = settings.enabledLogMarValues[0];
}

// Aplicar modo espejo inicial
if (settings.isMirrored) {
    document.body.classList.add('mirrored');
}

const modosEstaticos = ["Reloj Astigmático", "Test de Worth", "Rejilla de Amsler"];
const modosDePantalla = [
    ...Object.keys(settings.CARTILLAS_ETDRS),
    ...Object.keys(settings.CARTILLAS_NUMEROS),
    "Duo-Cromo",
    "Reloj Astigmático",
    "Test de Worth",
    "Rejilla de Amsler"
];
let indiceModoActual = 0;

// Estado para aleatorización
let randomizedLines = {};
const SLOAN_LETTERS = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'];
const NUMBERS_WITH_ZERO = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Referencias DOM
const bodyElement = document.body;
const infoHud = document.getElementById('info');
const logMarElement = document.getElementById('info-logmar');
const snellenElement = document.getElementById('info-snellen');
const etdrsChart = document.getElementById('etdrs-chart');
const etdrsLetrasElements = [
    document.getElementById('l1'), document.getElementById('l2'),
    document.getElementById('l3'), document.getElementById('l4'),
    document.getElementById('l5'), document.getElementById('l6'),
    document.getElementById('l7'), document.getElementById('l8')
];
const duochromeChart = document.getElementById('duochrome-chart');
const duochromeRed = document.getElementById('red-side');
const duochromeGreen = document.getElementById('green-side');
const astigmatismChart = document.getElementById('astigmatism-chart');
const worthTest = document.getElementById('worth-test');
const amslerGrid = document.getElementById('amsler-grid');

const debugDistancia = document.getElementById('debug-distancia');
const debugAncho = document.getElementById('debug-ancho');
const debugResolucion = document.getElementById('debug-resolucion');

const modeElements = {
    "Duo-Cromo": duochromeChart,
    "Reloj Astigmático": astigmatismChart,
    "Test de Worth": worthTest,
    "Rejilla de Amsler": amslerGrid
};

const etdrsDisplayRules = {
    "1.0": [1, 2],
    "0.9": [2, 1], "0.8": [2, 1], "0.7": [2, 1],
    "0.6": [3, 1],
    "0.5": [4, 0],
    "0.4": [5, 0], "0.3": [5, 0],
    "0.2": [6, 0],
    "0.1": [7, 0],
    "0.0": [8, 0], "-0.1": [8, 0], "-0.2": [8, 0], "-0.3": [8, 0]
};

// --- 2. FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN ---
function actualizarPantalla() {
    const modoActual = modosDePantalla[indiceModoActual];
    const esModoETDRS = settings.CARTILLAS_ETDRS[modoActual] ||
        settings.CARTILLAS_NUMEROS[modoActual];

    const esPruebaLogMAR = esModoETDRS || modoActual === "Duo-Cromo";

    bodyElement.classList.toggle('dark-background', modoActual === "Test de Worth");
    infoHud.classList.toggle('hidden', !esPruebaLogMAR);

    Object.values(modeElements).forEach(el => el.classList.add('hidden'));
    etdrsChart.classList.add('hidden');

    if (esModoETDRS) {
        renderEtdrs(modoActual);
    } else if (modeElements[modoActual]) {
        modeElements[modoActual].classList.remove('hidden');
        if (modoActual === "Duo-Cromo") {
            renderDuochrome();
        }
    }

    if (esPruebaLogMAR) {
        updateHud(modoActual);
    }
}

// --- FUNCIONES DE RENDERIZADO ---
function renderEtdrs(modoActual) {
    etdrsChart.classList.remove('hidden');
    const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
    etdrsChart.style.fontSize = `${nuevoTamanoPx}px`;
    etdrsChart.style.letterSpacing = "normal";

    const cartillaActual = settings.CARTILLAS_ETDRS[modoActual] ||
        settings.CARTILLAS_NUMEROS[modoActual];

    let indiceDeLinea = Math.round(10 - (valorLogMarActual * 10));
    indiceDeLinea = Math.max(0, Math.min(cartillaActual.length - 1, indiceDeLinea));

    // Lógica de aleatorización
    let lineContent = "";
    if (randomizedLines[valorLogMarActual.toFixed(1)]) {
        lineContent = randomizedLines[valorLogMarActual.toFixed(1)];
    } else {
        lineContent = cartillaActual[indiceDeLinea];
    }

    const items = lineContent.split(' ');

    etdrsLetrasElements.forEach(el => el.style.display = 'none');

    const rule = etdrsDisplayRules[valorLogMarActual.toFixed(1)] || (valorLogMarActual < 0.1 ? [8, 0] : [5, 0]);
    const [count, start] = rule;

    for (let i = 0; i < count; i++) {
        const itemIndex = start + i;
        const elementIndex = start + i;
        if (items[itemIndex] && etdrsLetrasElements[elementIndex]) {
            const char = items[itemIndex];
            const el = etdrsLetrasElements[elementIndex];

            el.textContent = char; // Renderizar texto normal
            el.style.display = 'inline';
        }
    }

    requestAnimationFrame(adjustContentScale);
}

function renderDuochrome() {
    const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
    duochromeChart.style.fontSize = `${nuevoTamanoPx}px`;

    if (duochromeRed.children.length === 0) {
        const duoLettersArray = settings.DUOCHROME_LETTERS.split(' ');
        const spans = `<span>${duoLettersArray[0]}</span><span>${duoLettersArray[1]}</span>`;
        duochromeRed.innerHTML = spans;
        duochromeGreen.innerHTML = spans;
    }
}

function updateHud(modoActual) {
    const textoSnellen = convertirLogMarASnellen(valorLogMarActual);
    logMarElement.textContent = `LogMAR: ${valorLogMarActual.toFixed(1)} (${modoActual})`;
    snellenElement.textContent = `Snellen: ${textoSnellen}`;

    debugDistancia.textContent = settings.distanciaMetros.toFixed(2);
    debugAncho.textContent = settings.anchoPantallaCm.toFixed(2);
    debugResolucion.textContent = settings.resolucionAnchoPx;
}

// --- HELPERS ---
function generateRandomLine(length, type) {
    let source;
    if (type === 'NUMBERS') source = NUMBERS_WITH_ZERO;
    else source = SLOAN_LETTERS;

    let result = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * source.length);
        result.push(source[randomIndex]);
    }
    return result.join(' ');
}

function changeLogMarStep(direction) {
    let currentIndex = settings.enabledLogMarValues.findIndex(v => Math.abs(v - valorLogMarActual) < 0.001);
    if (currentIndex === -1) currentIndex = 0;
    let newIndex = currentIndex - direction;
    if (newIndex >= 0 && newIndex < settings.enabledLogMarValues.length) {
        valorLogMarActual = settings.enabledLogMarValues[newIndex];
    }
}

function adjustContentScale() {
    const container = document.getElementById('etdrs-line-content');
    if (!container) return;
    container.style.transform = 'scale(1)';

    const contentWidth = container.scrollWidth;
    const viewportWidth = window.innerWidth;
    const maxWidth = viewportWidth * 0.90;

    let scale = 1;
    const scaleX = maxWidth / contentWidth;

    // Para Letras y Números, comportamiento original (solo ancho)
    if (contentWidth > maxWidth) {
        scale = scaleX;
    }

    if (scale < 1) {
        container.style.transform = `scale(${scale})`;
    } else {
        container.style.transform = 'scale(1)';
    }
}

function toggleMirrorMode() {
    settings.isMirrored = !settings.isMirrored;
    localStorage.setItem('isMirrored', JSON.stringify(settings.isMirrored));

    if (settings.isMirrored) {
        document.body.classList.add('mirrored');
    } else {
        document.body.classList.remove('mirrored');
    }
}

// --- EVENT LISTENERS ---
const KEY = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    RANDOMIZE: 'r',
    MIRROR: 'm'
};

window.addEventListener('keydown', function (event) {
    const currentMode = modosDePantalla[indiceModoActual];
    const oldMode = currentMode;

    if (modosEstaticos.includes(currentMode) && (event.key === KEY.UP || event.key === KEY.DOWN)) {
        return;
    }

    // Modo Espejo
    if (event.key.toLowerCase() === KEY.MIRROR) {
        toggleMirrorMode();
        return;
    }

    // Aleatorización
    if (event.key.toLowerCase() === KEY.RANDOMIZE) {
        const esModoETDRS = settings.CARTILLAS_ETDRS[currentMode];
        const esModoNumeros = settings.CARTILLAS_NUMEROS[currentMode];

        if (esModoETDRS || esModoNumeros) {
            let type = 'LETTERS';
            if (esModoNumeros) type = 'NUMBERS';

            // Generamos 8 caracteres para cubrir cualquier caso
            const newLine = generateRandomLine(8, type);
            randomizedLines[valorLogMarActual.toFixed(1)] = newLine;
            actualizarPantalla();
            return;
        }
    }

    switch (event.key) {
        case KEY.UP:
            changeLogMarStep(1);
            break;
        case KEY.DOWN:
            changeLogMarStep(-1);
            break;
        case KEY.RIGHT:
            indiceModoActual++;
            if (indiceModoActual >= modosDePantalla.length) indiceModoActual = 0;
            randomizedLines = {}; // Reset al cambiar modo
            break;
        case KEY.LEFT:
            indiceModoActual--;
            if (indiceModoActual < 0) indiceModoActual = modosDePantalla.length - 1;
            randomizedLines = {}; // Reset al cambiar modo
            break;
    }

    const newMode = modosDePantalla[indiceModoActual];
    if (newMode === "Duo-Cromo" && oldMode !== "Duo-Cromo") {
        valorLogMarActual = settings.duochromeInitialLogMar;
    }

    actualizarPantalla();
});

window.addEventListener('resize', adjustContentScale);
window.onload = actualizarPantalla;