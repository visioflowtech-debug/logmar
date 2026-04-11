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

  // --- Cartillas ETDRS (8 caracteres/línea, letras Sloan) ---
  CARTILLAS_ETDRS: {
    'Cartilla 1': [
      'N C K Z D R H S', 'H V D O S K C N', 'C Z S H V O R K', 'S R N K O V Z D',
      'V H C D R S N O', 'K O N V C D Z S', 'D H Z K R V C O', 'R S V O H N K Z',
      'Z D K S N R V H', 'O R C H D S K N',
    ],
    'Cartilla 2': [
      'D S R K N H Z V', 'V H Z C O N K S', 'H N O K R D V Z', 'Z K C D V O S N',
      'C S V H N R K D', 'R D V O K H Z C', 'N K Z S H D V O', 'S D V O C K R Z',
      'O H R C Z N D V', 'V Z N H D S K R',
    ],
  } as Record<string, string[]>,

  // --- Cartilla de Números ---
  CARTILLAS_NUMEROS: {
    'Numeros 1': [
      '1 7 4 9 2 8 5 3', '8 3 5 6 0 2 9 1', '4 9 7 2 1 6 0 8', '5 0 8 3 6 1 4 9',
      '9 2 4 1 7 5 3 0', '6 5 3 0 8 2 7 1', '2 7 9 4 1 6 5 0', '3 8 6 5 0 1 9 2',
      '7 4 2 9 1 8 3 5', '0 6 8 3 5 9 2 4',
    ],
  } as Record<string, string[]>,

  DUOCHROME_LETTERS: 'O C',

  // --- Cartilla LEA Pediátrica (Hyvärinen) ---
  CARTILLAS_LEA: {
    'LEA Pediátrica 1': [
      'A H C S H A S C', 'C S A H C S A H', 'H A S C S H C A', 'S C H A A S H C',
      'A H S C C A S H', 'H S C A S H A C', 'C A S H H C A S', 'S H A C A S C H',
      'A C S H C H S A', 'H S A C S A H C',
    ],
  } as Record<string, string[]>,

  // --- Cartilla Lighthouse ---
  CARTILLAS_LIGHTHOUSE: {
    'Lighthouse 1': [
      'A H U A H U A H', 'U A H U A H U A', 'H U A H U A H U', 'A U H A U H A U',
      'H A U H A U H A', 'U H A U H A U H', 'A H U H A U A H', 'U A H A U H U A',
      'H U A U H A H U', 'A U H H U A A U',
    ],
  } as Record<string, string[]>,
} as const;

export type AppConfig = typeof CONFIG;
