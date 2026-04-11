/**
 * tests/chart_logic.test.ts
 *
 * Suite de tests para src/chart_logic.ts — motor matemático LogMAR.
 *
 * Valores de referencia clínicos validados contra:
 *   - ISO 8596:2009 — Optotypes for the determination of visual acuity
 *   - Bailey & Lovie (1976) — New design principles for visual acuity letter charts
 *   - Ferris et al. (1982) — New visual acuity charts for clinical research
 *
 * Configuración estándar de referencia:
 *   Distancia: 6 m | Pantalla: 52.5 cm | Resolución: 1920 px | Factor: 1.0
 *
 * Valor canónico:
 *   calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR) ≈ 31.91 px
 *   (5 arcmin → 0.8727 cm × 36.571 px/cm = 31.91 px para pantalla de referencia)
 */

import { describe, it, expect } from 'vitest';
import { calcularTamanoLogMAR, convertirLogMarASnellen } from '../src/chart_logic';

// ─────────────────────────────────────────────────────────────────────────────
// Configuraciones de referencia
// ─────────────────────────────────────────────────────────────────────────────

/** Pantalla de referencia: monitor 23" Full HD a 6 metros */
const CONFIG_ESTANDAR = {
  distanciaMetros: 6.0,
  anchoPantallaCm: 52.5,
  resolucionAnchoPx: 1920,
  calibrationFactor: 1.0,
};

/** Pantalla 4K más pequeña para verificar que el cálculo escala correctamente */
const CONFIG_4K = {
  distanciaMetros: 6.0,
  anchoPantallaCm: 60.0,
  resolucionAnchoPx: 3840,
  calibrationFactor: 1.0,
};

/** Distancia corta de 3 metros (pediátrica) */
const CONFIG_3M = {
  distanciaMetros: 3.0,
  anchoPantallaCm: 52.5,
  resolucionAnchoPx: 1920,
  calibrationFactor: 1.0,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. convertirLogMarASnellen — Tabla validada clínicamente
// ─────────────────────────────────────────────────────────────────────────────

describe('convertirLogMarASnellen — conversión a fracción Snellen (base 20)', () => {

  it('LogMAR 0.0 → 20/20 (agudeza normal)', () => {
    expect(convertirLogMarASnellen(0.0)).toBe('20/20');
  });

  it('LogMAR 1.0 → 20/200 (límite legal de ceguera EE.UU.)', () => {
    expect(convertirLogMarASnellen(1.0)).toBe('20/200');
  });

  it('LogMAR 0.3 → 20/40 (mínimo para licencia de conducir en muchos países)', () => {
    expect(convertirLogMarASnellen(0.3)).toBe('20/40');
  });

  it('LogMAR -0.1 → 20/16 (agudeza supranormal)', () => {
    expect(convertirLogMarASnellen(-0.1)).toBe('20/16');
  });

  it('LogMAR -0.2 → 20/13 (agudeza supranormal)', () => {
    expect(convertirLogMarASnellen(-0.2)).toBe('20/13');
  });

  it('LogMAR -0.3 → 20/10 (agudeza supranormal máxima en cartilla)', () => {
    expect(convertirLogMarASnellen(-0.3)).toBe('20/10');
  });

  it('LogMAR 0.1 → 20/25', () => {
    expect(convertirLogMarASnellen(0.1)).toBe('20/25');
  });

  it('LogMAR 0.2 → 20/32', () => {
    expect(convertirLogMarASnellen(0.2)).toBe('20/32');
  });

  it('LogMAR 0.4 → 20/50', () => {
    expect(convertirLogMarASnellen(0.4)).toBe('20/50');
  });

  it('LogMAR 0.5 → 20/63', () => {
    expect(convertirLogMarASnellen(0.5)).toBe('20/63');
  });

  it('LogMAR 0.6 → 20/80', () => {
    expect(convertirLogMarASnellen(0.6)).toBe('20/80');
  });

  it('LogMAR 0.7 → 20/100', () => {
    expect(convertirLogMarASnellen(0.7)).toBe('20/100');
  });

  it('LogMAR 0.8 → 20/126', () => {
    expect(convertirLogMarASnellen(0.8)).toBe('20/126');
  });

  it('LogMAR 0.9 → 20/159 (20 × 10^0.9 = 158.866 → redondea a 159)', () => {
    expect(convertirLogMarASnellen(0.9)).toBe('20/159');
  });

  it('LogMAR 1.1 → 20/252', () => {
    expect(convertirLogMarASnellen(1.1)).toBe('20/252');
  });

  it('LogMAR 1.2 → 20/317', () => {
    expect(convertirLogMarASnellen(1.2)).toBe('20/317');
  });

  it('LogMAR 1.3 → 20/399 (inicio de cartilla ETDRS)', () => {
    expect(convertirLogMarASnellen(1.3)).toBe('20/399');
  });

  it('Retorna siempre un string con formato "20/N"', () => {
    const result = convertirLogMarASnellen(0.5);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^20\/\d+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. calcularTamanoLogMAR — Valor canónico y propiedades matemáticas
// ─────────────────────────────────────────────────────────────────────────────

describe('calcularTamanoLogMAR — tamaño en píxeles (CONFIG_ESTANDAR)', () => {

  it('Valor canónico: LogMAR 0.0 ≈ 31.91 px para pantalla de referencia (6m, 52.5cm, 1920px)', () => {
    const px = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    expect(px).toBeCloseTo(31.91, 0);
  });

  it('LogMAR 1.0 aprox. 10× el valor 20/20 (escala log)', () => {
    const px20_20  = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    const px20_200 = calcularTamanoLogMAR(1.0, CONFIG_ESTANDAR);
    expect(px20_200 / px20_20).toBeCloseTo(10.0, 0);
  });

  it('Escala monotónica: mayor LogMAR → mayor tamaño en px', () => {
    const valores = [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5,
                     0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    const pixeles = valores.map((v) => calcularTamanoLogMAR(v, CONFIG_ESTANDAR));
    for (let i = 1; i < pixeles.length; i++) {
      expect(pixeles[i]).toBeGreaterThan(pixeles[i - 1]!);
    }
  });

  it('calibrationFactor: factor 2.0 duplica exactamente el tamaño', () => {
    const px1 = calcularTamanoLogMAR(0.0, { ...CONFIG_ESTANDAR, calibrationFactor: 1.0 });
    const px2 = calcularTamanoLogMAR(0.0, { ...CONFIG_ESTANDAR, calibrationFactor: 2.0 });
    expect(px2 / px1).toBeCloseTo(2.0, 10);
  });

  it('Distancia proporcional: 3m produce aprox. la mitad de px que 6m', () => {
    const px6m = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    const px3m = calcularTamanoLogMAR(0.0, CONFIG_3M);
    expect(px3m / px6m).toBeCloseTo(0.5, 1);
  });
});

describe('calcularTamanoLogMAR — correctitud física (ISO 8596:2009)', () => {

  it('Optotipo 20/20 a 6m subtende 5 minutos de arco totales', () => {
    // Tamaño esperado = 6m × 100cm/m × tan(5/60 × π/180)
    const expectedCm = 600 * Math.tan((5 / 60) * (Math.PI / 180));
    const expectedPx = expectedCm * (1920 / 52.5);
    const actualPx   = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    expect(actualPx).toBeCloseTo(expectedPx, 5);
  });

  it('Verificación independiente: resultado en rango clínico válido (25–40 px para pantalla estándar 6m)', () => {
    const px = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    expect(px).toBeGreaterThan(25);
    expect(px).toBeLessThan(40);
  });

  it('Pantalla 4K: mayor densidad px/cm → más píxeles por el mismo tamaño físico', () => {
    const pxEstd = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    const px4k   = calcularTamanoLogMAR(0.0, CONFIG_4K);
    const ppcmEst = CONFIG_ESTANDAR.resolucionAnchoPx / CONFIG_ESTANDAR.anchoPantallaCm;
    const ppcm4k  = CONFIG_4K.resolucionAnchoPx / CONFIG_4K.anchoPantallaCm;
    expect(px4k / pxEstd).toBeCloseTo(ppcm4k / ppcmEst, 1);
  });

  it('LogMAR -0.3 (20/10) produce aprox. la mitad del tamaño de 20/20', () => {
    const px20_20 = calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR);
    const px_neg  = calcularTamanoLogMAR(-0.3, CONFIG_ESTANDAR);
    expect(px_neg).toBeLessThan(px20_20);
    expect(px_neg / px20_20).toBeCloseTo(0.5, 1);
  });
});

describe('calcularTamanoLogMAR — casos extremos y robustez', () => {

  it('LogMAR 1.3 (inicio cartilla ETDRS) retorna número positivo finito', () => {
    const px = calcularTamanoLogMAR(1.3, CONFIG_ESTANDAR);
    expect(Number.isFinite(px)).toBe(true);
    expect(px).toBeGreaterThan(0);
  });

  it('LogMAR -0.3 (límite inferior) retorna número positivo finito', () => {
    const px = calcularTamanoLogMAR(-0.3, CONFIG_ESTANDAR);
    expect(Number.isFinite(px)).toBe(true);
    expect(px).toBeGreaterThan(0);
  });

  it('Retorna siempre typeof number', () => {
    expect(typeof calcularTamanoLogMAR(0.0, CONFIG_ESTANDAR)).toBe('number');
    expect(typeof calcularTamanoLogMAR(1.0, CONFIG_ESTANDAR)).toBe('number');
    expect(typeof calcularTamanoLogMAR(-0.1, CONFIG_ESTANDAR)).toBe('number');
  });
});
