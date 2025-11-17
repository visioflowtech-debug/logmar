// En: main.js

// --- ¡¡NUEVO!! Objeto de Configuración "Vivo" ---
// 1. Lee los valores guardados de localStorage.
// 2. Si un valor no está en localStorage, usa el de CONFIG por defecto.
const settings = {
    anchoPantallaCm: parseFloat(localStorage.getItem('anchoPantallaCm') || CONFIG.anchoPantallaCm),
    resolucionAnchoPx: parseFloat(localStorage.getItem('resolucionAnchoPx') || CONFIG.resolucionAnchoPx),
    distanciaMetros: parseFloat(localStorage.getItem('distanciaMetros') || CONFIG.distanciaMetros),
    valorLogMarInicial: parseFloat(localStorage.getItem('valorLogMarInicial') || CONFIG.valorLogMarInicial),
    duochromeInitialLogMar: parseFloat(localStorage.getItem('duochromeInitialLogMar') || CONFIG.duochromeInitialLogMar),
    pasoLogMar: CONFIG.pasoLogMar, // Este no está en la página de config, así que lo leemos de CONFIG
    
    // Las cartillas siempre vienen de CONFIG
    CARTILLAS_ETDRS: CONFIG.CARTILLAS_ETDRS,
    CARTILLAS_NUMEROS: CONFIG.CARTILLAS_NUMEROS,
    DUOCHROME_LETTERS: CONFIG.DUOCHROME_LETTERS
};
// Nota: 'parseFloat' convierte el texto guardado (ej. "52.5") de nuevo a un número.

// --- 1. VARIABLES DE ESTADO Y REFERENCIAS AL DOM ---
// ¡ACTUALIZADO! Lee el valor inicial de 'settings'
let valorLogMarActual = settings.valorLogMarInicial; 
let indiceDeLinea = 0;

// ¡ACTUALIZADO! La lista de modos ahora usa 'settings'
const modosDePantalla = [
    ...Object.keys(settings.CARTILLAS_ETDRS), 
    ...Object.keys(settings.CARTILLAS_NUMEROS),
    "Duo-Cromo",
    "Reloj Astigmático",
    "Test de Worth",
    "Rejilla de Amsler"
];
let indiceModoActual = 0; 

// Referencias (sin cambios)
const bodyElement = document.body;
const infoHud = document.getElementById('info'); 
const logMarElement = document.getElementById('info-logmar');
const snellenElement = document.getElementById('info-snellen');
const etdrsChart = document.getElementById('etdrs-chart');
const etdrsLetrasElements = [
    // Los spans de las letras
    document.getElementById('l1'), document.getElementById('l2'),
    document.getElementById('l3'), document.getElementById('l4'),
    document.getElementById('l5')
];
const duochromeChart = document.getElementById('duochrome-chart');
const duochromeRed = document.getElementById('red-side');
const duochromeGreen = document.getElementById('green-side');
const astigmatismChart = document.getElementById('astigmatism-chart');
const worthTest = document.getElementById('worth-test');
const amslerGrid = document.getElementById('amsler-grid');

// Referencias para el debugger
const debugDistancia = document.getElementById('debug-distancia');
const debugAncho = document.getElementById('debug-ancho');
const debugResolucion = document.getElementById('debug-resolucion');


// --- 2. FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN ---

function actualizarPantalla() {
    
    const modoActual = modosDePantalla[indiceModoActual];
    
    // Ocultar todos
    etdrsChart.classList.add('hidden');
    duochromeChart.classList.add('hidden');
    astigmatismChart.classList.add('hidden');
    worthTest.classList.add('hidden'); 
    amslerGrid.classList.add('hidden');

    // Fondo del body
    if (modoActual === "Test de Worth") {
        bodyElement.classList.add('dark-background');
    } else {
        bodyElement.classList.remove('dark-background');
    }

    // Ocultar/Mostrar el HUD
    const esPruebaLogMAR = settings.CARTILLAS_ETDRS[modoActual] || 
                         settings.CARTILLAS_NUMEROS[modoActual] || 
                         modoActual === "Duo-Cromo";
    
    if (esPruebaLogMAR) {
        infoHud.classList.remove('hidden');
    } else {
        infoHud.classList.add('hidden');
    }

    // --- Lógica de Modos Específicos ---

    if (modoActual === "Reloj Astigmático") {
        astigmatismChart.classList.remove('hidden');
    
    } else if (modoActual === "Test de Worth") {
        worthTest.classList.remove('hidden');

    } else if (modoActual === "Rejilla de Amsler") {
        amslerGrid.classList.remove('hidden');

    } else if (modoActual === "Duo-Cromo") {
        duochromeChart.classList.remove('hidden');
        
        // ¡ACTUALIZADO! Llama a la función de cálculo con 'settings'
        const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
        duochromeChart.style.fontSize = `${nuevoTamanoPx}px`;
        
        // SUGERENCIA: Evitar re-renderizado si las letras ya existen.
        if (duochromeRed.children.length === 0) {
            const duoLettersArray = settings.DUOCHROME_LETTERS.split(' ');
            duochromeRed.innerHTML = `<span>${duoLettersArray[0]}</span><span>${duoLettersArray[1]}</span>`;
            duochromeGreen.innerHTML = `<span>${duoLettersArray[0]}</span><span>${duoLettersArray[1]}</span>`;
        }
    
    } else {
        // --- MODO ETDRS (Letras o Números) ---
        etdrsChart.classList.remove('hidden');
        
        // ¡ACTUALIZADO! Llama a la función de cálculo con 'settings'
        const nuevoTamanoPx = calcularTamanoLogMAR(valorLogMarActual, settings);
        etdrsChart.style.fontSize = `${nuevoTamanoPx}px`;

        let cartillaActual = settings.CARTILLAS_ETDRS[modoActual] || 
                             settings.CARTILLAS_NUMEROS[modoActual];
        
        // --- LÓGICA CORREGIDA PARA SELECCIONAR LA LÍNEA ---
        // La cartilla ETDRS va de LogMAR 1.0 (índice 0) a 0.0 (índice 10), etc.
        // La fórmula correcta es: indice = 10 - (logMar * 10)
        let indiceDeLinea = 10 - (valorLogMarActual * 10);
        // Nos aseguramos de que el índice esté dentro de los límites del array (0 a 9)
        indiceDeLinea = Math.max(0, Math.min(cartillaActual.length - 1, indiceDeLinea));
        const items = cartillaActual[indiceDeLinea].split(' ');
        
        // --- LÓGICA DE VISUALIZACIÓN INTELIGENTE ---
        // 1. Ocultar todas las letras primero
        etdrsLetrasElements.forEach(el => el.style.display = 'none');

        // 2. Lógica de visualización por niveles de LogMAR
        if (valorLogMarActual >= 1.3) {
            // Nivel 1.3 o superior: Mostrar UNA letra central
            etdrsLetrasElements[2].textContent = items[2];
            etdrsLetrasElements[2].style.display = 'inline';

        } else if (valorLogMarActual === 1.2) {
            // Nivel 1.2: Mostrar DOS letras centradas
            // Usamos las letras 2 y 3 de la línea (índices 1 y 2)
            // y las ponemos en los spans 2 y 3 para centrarlas.
            etdrsLetrasElements[1].textContent = items[1];
            etdrsLetrasElements[2].textContent = items[2];
            etdrsLetrasElements[1].style.display = 'inline';
            etdrsLetrasElements[2].style.display = 'inline';

        } else if (valorLogMarActual === 1.1) {
            // Nivel 1.1: Mostrar TRES letras centradas
            // Usamos las letras 2, 3 y 4 de la línea (índices 1, 2, 3)
            // y las ponemos en los spans 2, 3 y 4.
            etdrsLetrasElements[1].textContent = items[1];
            etdrsLetrasElements[2].textContent = items[2];
            etdrsLetrasElements[3].textContent = items[3];
            etdrsLetrasElements[1].style.display = 'inline';
            etdrsLetrasElements[2].style.display = 'inline';
            etdrsLetrasElements[3].style.display = 'inline';

        } else {
            // Nivel 1.0 o inferior: Mostrar la línea completa de 5 letras
            etdrsLetrasElements.forEach((el, i) => {
                if (items[i]) {
                    el.textContent = items[i];
                    el.style.display = 'inline';
                }
            });
        }
    }
    
    // Actualizar el HUD (si es visible)
    if (esPruebaLogMAR) {
        const textoSnellen = convertirLogMarASnellen(valorLogMarActual);
        logMarElement.textContent = `LogMAR: ${valorLogMarActual.toFixed(1)} (${modoActual})`;
        snellenElement.textContent = `Snellen: ${textoSnellen}`;

        // Actualizar el debugger
        debugDistancia.textContent = settings.distanciaMetros.toFixed(2);
        debugAncho.textContent = settings.anchoPantallaCm.toFixed(2);
        debugResolucion.textContent = settings.resolucionAnchoPx;
    }
}

// --- 3. EL "ESCUCHADOR" DE EVENTOS ---

const KEY = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight'
};

window.addEventListener('keydown', function(event) {
    let oldMode = modosDePantalla[indiceModoActual]; 
    const currentMode = modosDePantalla[indiceModoActual];

    const modosEstaticos = ["Reloj Astigmático", "Test de Worth", "Rejilla de Amsler"];
    
    switch (event.key) {
        case KEY.UP: 
            if (modosEstaticos.includes(currentMode)) break; 
            // ¡ACTUALIZADO! Usa el pasoLogMar de 'settings'
            valorLogMarActual += settings.pasoLogMar;
            break;
        case KEY.DOWN: 
            if (modosEstaticos.includes(currentMode)) break; 
            valorLogMarActual -= settings.pasoLogMar;
            break;
        
        case KEY.RIGHT: 
            indiceModoActual++;
            if (indiceModoActual >= modosDePantalla.length) indiceModoActual = 0; 
            break;
        case KEY.LEFT:
             indiceModoActual--;
            if (indiceModoActual < 0) indiceModoActual = modosDePantalla.length - 1; 
            break;
    }
    
    valorLogMarActual = Math.round(valorLogMarActual * 10) / 10;
    
    let newMode = modosDePantalla[indiceModoActual];
    if (newMode === "Duo-Cromo" && oldMode !== "Duo-Cromo") {
        // ¡ACTUALIZADO! Usa el valor de 'settings'
        valorLogMarActual = settings.duochromeInitialLogMar;
    }
    
    actualizarPantalla();
});

// --- 4. CARGA INICIAL ---
window.onload = actualizarPantalla;