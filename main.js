// En: main.js

// Helper para parsear JSON de forma segura
function safeJsonParse(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage:`, e);
        return defaultValue;
    }
}

// Verificar que CONFIG existe
if (typeof CONFIG === 'undefined') {
    console.error("CONFIG object not found! Check config.js");
    alert("Error: No se pudo cargar la configuración. Verifique config.js");
}

// --- ¡¡NUEVO!! Objeto de Configuración "Vivo" ---
const settings = {
    anchoPantallaCm: parseFloat(localStorage.getItem('anchoPantallaCm') || (typeof CONFIG !== 'undefined' ? CONFIG.anchoPantallaCm : 52.5)),
    resolucionAnchoPx: parseFloat(localStorage.getItem('resolucionAnchoPx') || (typeof CONFIG !== 'undefined' ? CONFIG.resolucionAnchoPx : 1920)),
    distanciaMetros: parseFloat(localStorage.getItem('distanciaMetros') || (typeof CONFIG !== 'undefined' ? CONFIG.distanciaMetros : 6.0)),
    valorLogMarInicial: parseFloat(localStorage.getItem('valorLogMarInicial') || (typeof CONFIG !== 'undefined' ? CONFIG.valorLogMarInicial : 1.0)),
    duochromeInitialLogMar: parseFloat(localStorage.getItem('duochromeInitialLogMar') || (typeof CONFIG !== 'undefined' ? CONFIG.duochromeInitialLogMar : 0.6)),
    pasoLogMar: (typeof CONFIG !== 'undefined' ? CONFIG.pasoLogMar : 0.1),
    calibrationFactor: parseFloat(localStorage.getItem('calibrationFactor') || (typeof CONFIG !== 'undefined' ? CONFIG.calibrationFactor : 1.0)),
    enabledLogMarValues: safeJsonParse('enabledLogMarValues', (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_ENABLED_LOGMAR : [])),
    CARTILLAS_ETDRS: (typeof CONFIG !== 'undefined' ? CONFIG.CARTILLAS_ETDRS : {}),
    CARTILLAS_NUMEROS: (typeof CONFIG !== 'undefined' ? CONFIG.CARTILLAS_NUMEROS : {}),
    DUOCHROME_LETTERS: (typeof CONFIG !== 'undefined' ? CONFIG.DUOCHROME_LETTERS : "O C"),

    // --- Configuración Específica Duo-Cromo ---
    duochromeTargetScale: parseFloat(localStorage.getItem('duochromeTargetScale') || (typeof CONFIG !== 'undefined' ? CONFIG.duochromeTargetScale : 1.0)),
    duochromeLetterLines: parseInt(localStorage.getItem('duochromeLetterLines') || (typeof CONFIG !== 'undefined' ? CONFIG.duochromeLetterLines : 2)),

    // --- Configuración de Espejo ---
    isMirrored: safeJsonParse('isMirrored', false)
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
        // La lógica de renderizado está más abajo
    } else if (modeElements[modoActual]) {
        modeElements[modoActual].classList.remove('hidden');
        if (modoActual === "Duo-Cromo") {
            renderDuochrome();
        }
    }

    if (esModoETDRS) {
        etdrsChart.classList.remove('hidden');
        const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
        etdrsChart.style.fontSize = `${nuevoTamanoPx}px`;
        etdrsChart.style.letterSpacing = "normal";

        const cartillaActual = settings.CARTILLAS_ETDRS[modoActual] ||
            settings.CARTILLAS_NUMEROS[modoActual];

        if (!cartillaActual) {
            console.error("No se encontró cartilla para:", modoActual);
            return;
        }

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
    }

    requestAnimationFrame(adjustContentScale);
    updateHud(modoActual);
}

function renderDuochrome() {
    // Limpiar contenido previo
    duochromeRed.innerHTML = '';
    duochromeGreen.innerHTML = '';

    // Configuración dinámica basada en settings
    const linesConfig = [];

    // 1. Línea del Objetivo (Círculos concéntricos)
    // Usamos LogMAR 0.7 como base, pero aplicamos el factor de escala
    // Si el usuario quiere el círculo más grande, aumentamos el factor de escala que afectará al tamaño final
    linesConfig.push({
        logMar: 0.7,
        type: 'TARGET',
        customScale: settings.duochromeTargetScale // Pasamos el factor de escala personalizado
    });

    // 2. Líneas de Letras Dinámicas
    let currentLogMar = 0.5; // Empezamos en 0.5 (20/63)
    const letterLinesCount = settings.duochromeLetterLines; // Valor desde configuración (default 2)

    for (let i = 0; i < letterLinesCount; i++) {
        // Aumentamos cantidad de letras a medida que se hacen más pequeñas
        let letterCount = 4 + i;
        if (letterCount > 6) letterCount = 6; // Tope de letras por línea

        linesConfig.push({
            logMar: currentLogMar,
            type: 'LETTERS',
            count: letterCount
        });

        // Reducir LogMAR para la siguiente línea (hacerla más pequeña)
        // Pasos típicos: 0.5 -> 0.3 -> 0.1 -> 0.0 -> -0.1
        if (currentLogMar > 0.4) currentLogMar = 0.3;
        else if (currentLogMar > 0.2) currentLogMar = 0.1;
        else if (currentLogMar > 0.0) currentLogMar = 0.0;
        else currentLogMar -= 0.1;

        // Evitar líneas demasiado pequeñas que no se vean
        if (currentLogMar < -0.3) break;
    }

    const redFragment = document.createDocumentFragment();
    const greenFragment = document.createDocumentFragment();

    linesConfig.forEach(line => {
        // Calcular tamaño para este valor LogMAR
        // IMPORTANTE: Para Duo-Cromo, ignoramos el factor de calibración para evitar distorsión excesiva
        // si el usuario tiene un factor muy alto.
        const settingsSinCalibracion = { ...settings, calibrationFactor: 1.0 };
        let fontSizePx = calcularTamanoLogMAR(line.logMar, settingsSinCalibracion);

        // Aplicar escala personalizada si existe (solo para el TARGET en este caso)
        if (line.customScale) {
            fontSizePx = fontSizePx * line.customScale;
        }

        // Crear contenedor de línea
        const lineContainerRed = document.createElement('div');
        lineContainerRed.style.fontSize = `${fontSizePx}px`;
        lineContainerRed.style.lineHeight = '1.5'; // Un poco más de espacio
        lineContainerRed.style.display = 'flex';
        lineContainerRed.style.gap = '0.5em';
        lineContainerRed.style.justifyContent = 'center';

        const lineContainerGreen = document.createElement('div');
        lineContainerGreen.style.fontSize = `${fontSizePx}px`;
        lineContainerGreen.style.lineHeight = '1.5';
        lineContainerGreen.style.display = 'flex';
        lineContainerGreen.style.gap = '0.5em';
        lineContainerGreen.style.justifyContent = 'center';

        if (line.type === 'TARGET') {
            // Renderizar Blanco (Círculos concéntricos)
            const target = document.createElement('div');
            target.className = 'optotype-target';

            // Clonar para ambos lados (el target es simétrico, no necesita espejo)
            lineContainerRed.appendChild(target);
            lineContainerGreen.appendChild(target.cloneNode(true));

        } else {
            // Renderizar Letras
            const lineText = generateRandomLine(line.count, 'LETTERS');
            const letters = lineText.split(' ');

            // Lado Rojo: Orden normal
            letters.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                lineContainerRed.appendChild(span);
            });

            // Lado Verde: Orden inverso (Espejo del rojo)
            const reversedLetters = [...letters].reverse();
            reversedLetters.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                lineContainerGreen.appendChild(span);
            });
        }

        redFragment.appendChild(lineContainerRed);
        greenFragment.appendChild(lineContainerGreen);
    });

    duochromeRed.appendChild(redFragment);
    duochromeGreen.appendChild(greenFragment);
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
    // Verificar licencia antes de permitir interacción
    if (typeof LicenseManager !== 'undefined' && !LicenseManager.isActivated()) {
        return;
    }

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
            if (modosDePantalla[indiceModoActual] === "Duo-Cromo") return;
            changeLogMarStep(1);
            break;
        case KEY.DOWN:
            if (modosDePantalla[indiceModoActual] === "Duo-Cromo") return;
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
    // En Duo-Cromo ya no usamos valorLogMarActual para el tamaño global, 
    // pero podemos resetearlo por consistencia si salimos de él.
    if (newMode === "Duo-Cromo" && oldMode !== "Duo-Cromo") {
        // No es estrictamente necesario setear valorLogMarActual porque renderDuochrome usa un rango fijo,
        // pero ayuda a mantener el estado consistente.
        valorLogMarActual = 0.6;
    }

    actualizarPantalla();
});

window.addEventListener('resize', adjustContentScale);
window.addEventListener('load', actualizarPantalla);

// --- CONTROL REMOTO (PeerJS) ---
const RemoteControl = {
    peer: null,
    conn: null,
    hostId: null,

    init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },

    setup() {
        // Generar ID corto aleatorio (4 caracteres)
        this.hostId = this.generateShortId();

        // UI References
        const remoteLink = document.getElementById('remote-link');
        const remoteModal = document.getElementById('remote-modal');
        const closeRemoteModal = document.getElementById('close-remote-modal');
        const remoteIdDisplay = document.getElementById('remote-id-display');
        const remoteUrlDisplay = document.getElementById('remote-url-display');
        const remoteQr = document.getElementById('remote-qr');

        if (!remoteLink || !remoteModal) {
            console.error("Remote Control UI elements not found!");
            return;
        }

        // Event Listeners UI
        remoteLink.addEventListener('click', () => {
            this.startHost();

            // Mostrar modal (quitando clase hidden y forzando display)
            remoteModal.classList.remove('hidden');
            remoteModal.style.display = 'flex';

            remoteIdDisplay.textContent = this.hostId;

            // Generar URL para el QR (asumiendo que remote.html está en la misma carpeta)
            const currentUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/remote.html';
            remoteUrlDisplay.textContent = currentUrl;

            // Generar QR (usando API pública para demo, idealmente usar librería local)
            remoteQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
        });

        closeRemoteModal.addEventListener('click', () => {
            remoteModal.classList.add('hidden');
            remoteModal.style.display = 'none';
        });
    },

    generateShortId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, 1, O, 0 para evitar confusión
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    startHost() {
        if (this.peer) return; // Ya iniciado
        if (typeof Peer === 'undefined') {
            console.error("PeerJS library not loaded!");
            alert("Error: PeerJS no está cargado. Verifique su conexión a internet.");
            return;
        }

        // Prefijo para evitar colisiones globales en el servidor público
        const fullId = "logmar-app-" + this.hostId;

        this.peer = new Peer(fullId, {
            debug: 2
        });

        this.peer.on('open', (id) => {
        });

        this.peer.on('connection', (conn) => {
            this.conn = conn;

            // Auto-close modal on connection
            const remoteModal = document.getElementById('remote-modal');
            if (remoteModal) {
                remoteModal.classList.add('hidden');
                remoteModal.style.display = 'none';
            }

            conn.on('data', (data) => {
                this.handleCommand(data);
            });
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            if (err.type === 'unavailable-id') {
                // Si el ID ya existe, generar otro y reintentar (raro con 4 chars pero posible)
                this.hostId = this.generateShortId();
                this.peer = null;
                this.startHost();
            }
        });
    },

    handleCommand(data) {
        // Verificar licencia
        if (typeof LicenseManager !== 'undefined' && !LicenseManager.isActivated()) return;

        // Bloquear cambios de tamaño en Duo-Cromo
        if (modosDePantalla[indiceModoActual] === "Duo-Cromo") {
            if (['increase_size', 'decrease_size', 'reset_size'].includes(data.action)) {
                return;
            }
        }

        switch (data.action) {
            case 'increase_size':
                changeLogMarStep(1);
                actualizarPantalla();
                break;
            case 'decrease_size':
                changeLogMarStep(-1);
                actualizarPantalla();
                break;
            case 'reset_size':
                // Resetear a Letras (Cartilla 1) en 20/200 (LogMAR 1.0)
                const lettersIndex = modosDePantalla.findIndex(m => m.includes("Cartilla 1"));
                if (lettersIndex !== -1) {
                    indiceModoActual = lettersIndex;
                }
                valorLogMarActual = 1.0;
                randomizedLines = {};
                actualizarPantalla();
                break;
            case 'next_optotype':
                indiceModoActual++;
                if (indiceModoActual >= modosDePantalla.length) indiceModoActual = 0;
                randomizedLines = {};
                actualizarPantalla();
                break;
            case 'prev_optotype':
                indiceModoActual--;
                if (indiceModoActual < 0) indiceModoActual = modosDePantalla.length - 1;
                randomizedLines = {};
                actualizarPantalla();
                break;
            case 'randomize':
                // Simular tecla 'r'
                const event = new KeyboardEvent('keydown', { key: 'r' });
                window.dispatchEvent(event);
                break;
            case 'toggle_mirror':
                toggleMirrorMode();
                break;
            case 'toggle_red_green':
                // Buscar modo Duo-Cromo
                const duoIndex = modosDePantalla.indexOf("Duo-Cromo");
                if (duoIndex !== -1) {
                    if (indiceModoActual === duoIndex) {
                        // Si ya está en Duo-Cromo, volver al anterior (o al primero)
                        indiceModoActual = 0;
                    } else {
                        indiceModoActual = duoIndex;
                        // Resetear tamaño al entrar en Duo-Cromo
                        valorLogMarActual = (typeof settings.duochromeInitialLogMar !== 'undefined') ? settings.duochromeInitialLogMar : 0.6;
                    }
                    randomizedLines = {};
                    actualizarPantalla();
                }
                break;
            case 'set_type':
                // Cambiar a un tipo específico de optotipo
                this.setOptotypeByType(data.value);
                break;
            case 'set_mode':
                // Cambiar directamente a un modo específico (ej. Reloj, Worth, Amsler)
                this.setMode(data.value);
                break;
            case 'toggle_mask':
                // Implementar máscara (futuro)
                alert("Máscara no implementada aún");
                break;
        }
    },

    setMode(modeName) {
        // Verificar si el modo existe en la lista de modos disponibles
        let index = modosDePantalla.indexOf(modeName);

        if (index === -1) {
            // Intento de búsqueda flexible (por si acaso hay problemas de encoding)
            index = modosDePantalla.findIndex(m => m.includes(modeName) || modeName.includes(m));
        }

        if (index !== -1) {
            indiceModoActual = index;
            randomizedLines = {};
            actualizarPantalla();
        }
    },

    setOptotypeByType(type) {
        // Buscar el primer modo que coincida con el tipo solicitado
        let targetMode = null;

        // Mapeo de tipos a nombres en settings
        // settings.CARTILLAS_ETDRS keys: "Cartilla 1", "Cartilla 2"
        // settings.CARTILLAS_NUMEROS keys: "Numeros 1"

        const map = {
            'sloan': 'Cartilla 1', // Mapear 'sloan' a la primera cartilla de letras
            'numbers': 'Numeros 1', // Mapear 'numbers' a la primera cartilla de números
            'landolt': 'Landolt',
            'e_chart': 'E',
            'allen': 'Allen',
            'forms': 'Formas'
        };

        const targetName = map[type];
        if (!targetName) return;

        const index = modosDePantalla.findIndex(m => m.includes(targetName));
        if (index !== -1) {
            indiceModoActual = index;
            randomizedLines = {};
            actualizarPantalla();
        }
    }
};

// Iniciar lógica del remoto
RemoteControl.init();