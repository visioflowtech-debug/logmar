// En: config.js

const CONFIG = {
    // --- 1. CALIBRACIÓN DE PANTALLA ---
    anchoPantallaCm: 52.5, 
    resolucionAnchoPx: 1920.0, 
    
    // --- 2. AJUSTES DE LA PRUEBA ---
    distanciaMetros: 6.0,     // Tu distancia de 6 metros
    valorLogMarInicial: 1.3,  // El inicio de la cartilla ETDRS
    pasoLogMar: 0.1,

    // --- 3. PARÁMETROS DE LA CARTILLA ETDRS ---
    CARTILLAS_ETDRS: {
        "Cartilla 1": [
            "N C K Z D", "H V D O S", "C Z S H V", "S R N K O", "V H C D R",
            "K O N V C", "D H Z K R", "R S V O H", "Z D K S N", "O R C H D"
        ],
        "Cartilla 2": [
            "D S R K N", "V H Z C O", "H N O K R", "Z K C D V", "C S V H N",
            "R D V O K", "N K Z S H", "S D V O C", "O H R C Z", "V Z N H D"
        ]
    },

    // ¡¡NUEVO!! Cartilla de Números LogMAR
    CARTILLAS_NUMEROS: {
        "Numeros 1": [
            "1 7 4 9 2",
            "8 3 5 6 0",
            "4 9 7 2 1",
            "5 0 8 3 6",
            "9 2 4 1 7",
            "6 5 3 0 8",
            "2 7 9 4 1",
            "3 8 6 5 0",
            "7 4 2 9 1",
            "0 6 8 3 5"
        ]
    },

    // --- 4. PARÁMETROS DUO-CROMO ---
    DUOCHROME_LETTERS: "O C",
    
    // LogMAR inicial para la prueba Dúo-Cromo (20/200)
    duochromeInitialLogMar: 1.0 
};