// En: config.js

const CONFIG = {
    // --- 1. CALIBRACIÓN DE PANTALLA ---
    anchoPantallaCm: 52.5,
    resolucionAnchoPx: 1920.0,

    // --- 2. AJUSTES DE LA PRUEBA ---
    distanciaMetros: 6.0,     // Tu distancia de 6 metros
    valorLogMarInicial: 1.3,  // El inicio de la cartilla ETDRS
    pasoLogMar: 0.1,
    calibrationFactor: 1.0, // Factor de corrección manual (1.0 = sin cambios)

    // --- 2.1 CONFIGURACIÓN DE LÍNEAS VISIBLES ---
    // Todas las líneas posibles soportadas por el sistema
    POSSIBLE_LOGMAR_VALUES: [1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3],

    // Las líneas que se muestran por defecto (según solicitud del usuario)
    DEFAULT_ENABLED_LOGMAR: [1.0, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0],

    // --- 3. PARÁMETROS DE LA CARTILLA ETDRS ---
    // Se han extendido a 8 caracteres por línea para soportar hasta 20/20 con 8 letras
    CARTILLAS_ETDRS: {
        "Cartilla 1": [
            "N C K Z D R H S", "H V D O S K C N", "C Z S H V O R K", "S R N K O V Z D", "V H C D R S N O",
            "K O N V C D Z S", "D H Z K R V C O", "R S V O H N K Z", "Z D K S N R V H", "O R C H D S K N"
        ],
        "Cartilla 2": [
            "D S R K N H Z V", "V H Z C O N K S", "H N O K R D V Z", "Z K C D V O S N", "C S V H N R K D",
            "R D V O K H Z C", "N K Z S H D V O", "S D V O C K R Z", "O H R C Z N D V", "V Z N H D S K R"
        ]
    },

    // ¡¡NUEVO!! Cartilla de Números LogMAR
    CARTILLAS_NUMEROS: {
        "Numeros 1": [
            "1 7 4 9 2 8 5 3",
            "8 3 5 6 0 2 9 1",
            "4 9 7 2 1 6 0 8",
            "5 0 8 3 6 1 4 9",
            "9 2 4 1 7 5 3 0",
            "6 5 3 0 8 2 7 1",
            "2 7 9 4 1 6 5 0",
            "3 8 6 5 0 1 9 2",
            "7 4 2 9 1 8 3 5",
            "0 6 8 3 5 9 2 4"
        ]
    },

    // --- 4. PARÁMETROS DUO-CROMO ---
    DUOCHROME_LETTERS: "O C",

    // LogMAR inicial para la prueba Dúo-Cromo (20/80)
    duochromeInitialLogMar: 0.6
};