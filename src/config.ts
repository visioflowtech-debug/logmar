/**
 * config.ts — Configuración inmutable por defecto de LogMAR Pro
 *
 * Los optotipos ETDRS/LEA/Lighthouse son estándar oftalmológico internacional.
 * NO modificar sin revisión médica y validación del agente `clinico`.
 *
 * Referencias:
 *   - Sloan (1959): C D H K N O R S V Z
 *   - Ferris et al. (1982): ETDRS chart
 *   - Lea Hyvärinen: símbolos pediátricos (Apple, House, Circle, Square)
 *   - Lighthouse International: figuras pediátricas (Apple, House, Umbrella)
 */

export const CONFIG = {
  // --- Calibración de pantalla por defecto ---
  anchoPantallaCm: 52.5,
  resolucionAnchoPx: 1920.0,

  // --- Ajustes de prueba ---
  distanciaMetros: 6.0,
  valorLogMarInicial: 1.3,
  pasoLogMar: 0.1,
  calibrationFactor: 1.0,

  // --- Duo-Cromo ---
  duochromeInitialLogMar: 0.6,
  duochromeTargetScale: 1.0,
  duochromeLetterLines: 2,

  // --- Líneas disponibles: 1.3 a -0.3 en pasos de 0.1 ---
  POSSIBLE_LOGMAR_VALUES: [
    1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4,
    0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3,
  ],

  DEFAULT_ENABLED_LOGMAR: [1.0, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0],

  // --- Cartilla ETDRS (5 letras Sloan por línea — estándar Bailey & Lovie 1976, Ferris 1982) ---
  //
  // Cada índice corresponde a un valor en POSSIBLE_LOGMAR_VALUES:
  //   [0]=1.3, [1]=1.2, [2]=1.1, [3]=1.0, [4]=0.9, [5]=0.8, [6]=0.7, [7]=0.6,
  //   [8]=0.5, [9]=0.4, [10]=0.3, [11]=0.2, [12]=0.1, [13]=0.0, [14]=-0.1, [15]=-0.2, [16]=-0.3
  //
  // Requisitos clínicos (Ferris 1982 / ISO 8596:2009):
  //   - 5 letras por línea, sin repetición dentro de la línea
  //   - Set Sloan: C D H K N O R S V Z (Sloan 1959)
  //   - Progresión 0.1 log units entre líneas (Bailey & Lovie 1976)
  //   - La variabilidad entre sesiones la provee la aleatorización por sesión (main.ts)
  //   - Las secuencias son propias de LogMAR Pro (no transcripciones de Precision Vision)
  CARTILLAS_ETDRS: {
    'ETDRS': [
      'H S R D N', // 1.3
      'C V Z O K', // 1.2
      'K H O N Z', // 1.1
      'D S R C V', // 1.0
      'N R H K C', // 0.9
      'O V Z D S', // 0.8
      'S D N V H', // 0.7
      'Z C K R O', // 0.6
      'H K D Z R', // 0.5
      'N O S C V', // 0.4
      'R V N H O', // 0.3
      'D K Z C S', // 0.2
      'V O H D K', // 0.1
      'S Z R N C', // 0.0
      'C N D O R', // -0.1
      'Z H V S K', // -0.2
      'O R K N V', // -0.3
    ],
  } as Record<string, string[]>,

  // --- Cartilla de Números (5 dígitos por línea, sin repetición) ---
  CARTILLAS_NUMEROS: {
    'Numeros 1': [
      '5 1 8 3 9', // 1.3
      '2 7 4 6 0', // 1.2
      '9 3 6 1 4', // 1.1
      '0 8 2 7 5', // 1.0
      '4 6 1 9 2', // 0.9
      '3 0 7 5 8', // 0.8
      '1 5 4 2 6', // 0.7
      '8 9 0 3 7', // 0.6
      '6 2 9 8 0', // 0.5  — nota: 0 aparece en índices 5 y 8; en diferentes líneas es válido
      '7 4 3 1 5', // 0.4
      '0 9 5 4 6', // 0.3
      '3 7 2 8 1', // 0.2
      '4 1 6 0 9', // 0.1
      '8 5 3 7 2', // 0.0
      '9 6 0 4 3', // -0.1
      '2 8 7 5 1', // -0.2
      '5 3 1 6 8', // -0.3
    ],
  } as Record<string, string[]>,

  DUOCHROME_LETTERS: 'O C',

  // --- Cartilla LEA Pediátrica (Hyvärinen) ---
  // Único test pediátrico estándar de la app. Las Figuras de Allen (Lighthouse)
  // fueron eliminadas en v1.5 — reemplazadas por LEA Symbols desde la
  // publicación de Hyvärinen (1976) como estándar internacional (AAO, AOA, ICO).
  CARTILLAS_LEA: {
    'LEA Pediátrica 1': [
      'A H C S H A S C', 'C S A H C S A H', 'H A S C S H C A', 'S C H A A S H C',
      'A H S C C A S H', 'H S C A S H A C', 'C A S H H C A S', 'S H A C A S C H',
      'A C S H C H S A', 'H S A C S A H C',
    ],
  } as Record<string, string[]>,

} as const;

export type AppConfig = typeof CONFIG;
