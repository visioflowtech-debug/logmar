/**
 * tests/config.test.ts
 *
 * Tests de integridad para src/config.ts — cartillas ETDRS, LEA, Lighthouse, Números.
 *
 * Objetivo: detectar regresiones en los sets de optotipos clínicos.
 * NO valida la ciencia (eso es tarea del agente clinico),
 * sino que los datos en CONFIG son internamente consistentes y completos.
 *
 * Referencias:
 *   - Sloan (1959) — New test charts for the measurement of visual acuity
 *   - Ferris et al. (1982) — ETDRS: C D H K N O R S V Z
 *   - Lea Hyvärinen — LEA Symbols (Apple, House, Circle, Square)
 *   - Lighthouse International — Lighthouse Pediatric symbols
 */

import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config';

// ─────────────────────────────────────────────────────────────────────────────
// Sets de caracteres válidos por tipo
// ─────────────────────────────────────────────────────────────────────────────

const SLOAN_VALIDAS       = new Set(['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z']);
const LEA_VALIDOS         = new Set(['A', 'H', 'C', 'S']);
const LIGHTHOUSE_VALIDOS  = new Set(['A', 'H', 'U']);
const DIGITOS_VALIDOS     = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

function parsearLinea(linea: string): string[] {
  return linea.trim().split(/\s+/);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Valores por defecto de calibración
// ─────────────────────────────────────────────────────────────────────────────

describe('CONFIG — valores por defecto de calibración', () => {

  it('distanciaMetros es 6.0 (distancia ETDRS estándar)', () => {
    expect(CONFIG.distanciaMetros).toBe(6.0);
  });

  it('pasoLogMar es 0.1 (paso logarítmico ETDRS)', () => {
    expect(CONFIG.pasoLogMar).toBe(0.1);
  });

  it('calibrationFactor es 1.0 (sin corrección por defecto)', () => {
    expect(CONFIG.calibrationFactor).toBe(1.0);
  });

  it('valorLogMarInicial es 1.3 (línea más grande de la cartilla)', () => {
    expect(CONFIG.valorLogMarInicial).toBe(1.3);
  });

  it('anchoPantallaCm y resolucionAnchoPx son positivos', () => {
    expect(CONFIG.anchoPantallaCm).toBeGreaterThan(0);
    expect(CONFIG.resolucionAnchoPx).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Valores LogMAR posibles y habilitados por defecto
// ─────────────────────────────────────────────────────────────────────────────

describe('CONFIG — POSSIBLE_LOGMAR_VALUES y DEFAULT_ENABLED_LOGMAR', () => {

  it('POSSIBLE_LOGMAR_VALUES contiene 17 líneas (1.3 a -0.3 en pasos de 0.1)', () => {
    expect(CONFIG.POSSIBLE_LOGMAR_VALUES).toHaveLength(17);
  });

  it('POSSIBLE_LOGMAR_VALUES va de 1.3 a -0.3 en orden descendente', () => {
    const vals = CONFIG.POSSIBLE_LOGMAR_VALUES;
    expect(vals[0]).toBeCloseTo(1.3, 10);
    expect(vals[vals.length - 1]).toBeCloseTo(-0.3, 10);
  });

  it('POSSIBLE_LOGMAR_VALUES está ordenado de mayor a menor', () => {
    const vals = CONFIG.POSSIBLE_LOGMAR_VALUES;
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeLessThan(vals[i - 1]!);
    }
  });

  it('DEFAULT_ENABLED_LOGMAR es subconjunto de POSSIBLE_LOGMAR_VALUES', () => {
    const posibles = new Set(CONFIG.POSSIBLE_LOGMAR_VALUES.map((v) => v.toFixed(1)));
    for (const v of CONFIG.DEFAULT_ENABLED_LOGMAR) {
      expect(posibles.has(v.toFixed(1))).toBe(true);
    }
  });

  it('DEFAULT_ENABLED_LOGMAR incluye 0.0 (agudeza 20/20)', () => {
    expect(CONFIG.DEFAULT_ENABLED_LOGMAR.some((v) => Math.abs(v) < 0.001)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cartillas ETDRS (Sloan) — integridad
// ─────────────────────────────────────────────────────────────────────────────

describe('CARTILLAS_ETDRS — integridad de letras Sloan', () => {

  for (const [nombre, lineas] of Object.entries(CONFIG.CARTILLAS_ETDRS)) {

    it(`${nombre}: tiene 17 líneas (una por cada valor en POSSIBLE_LOGMAR_VALUES)`, () => {
      expect(lineas).toHaveLength(17);
    });

    it(`${nombre}: cada línea tiene exactamente 5 letras (estándar ETDRS — Ferris 1982)`, () => {
      for (const linea of lineas) {
        expect(parsearLinea(linea)).toHaveLength(5);
      }
    });

    it(`${nombre}: solo usa letras Sloan ETDRS válidas (C D H K N O R S V Z)`, () => {
      for (const linea of lineas) {
        for (const letra of parsearLinea(linea)) {
          expect(SLOAN_VALIDAS.has(letra)).toBe(true);
        }
      }
    });

    it(`${nombre}: no hay letras repetidas dentro de la misma línea`, () => {
      for (const linea of lineas) {
        const letras = parsearLinea(linea);
        expect(new Set(letras).size).toBe(letras.length);
      }
    });

    it(`${nombre}: no hay líneas duplicadas entre sí`, () => {
      expect(new Set(lineas).size).toBe(lineas.length);
    });

    it(`${nombre}: las 10 letras Sloan aparecen en la cartilla`, () => {
      const encontradas = new Set(lineas.flatMap((l) => parsearLinea(l)));
      for (const letra of SLOAN_VALIDAS) {
        expect(encontradas.has(letra)).toBe(true);
      }
    });
  }

  it('Existen exactamente 2 cartillas ETDRS (Cartilla 1 y Cartilla 2)', () => {
    const keys = Object.keys(CONFIG.CARTILLAS_ETDRS);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('Cartilla 1');
    expect(keys).toContain('Cartilla 2');
  });

  it('Cartilla 1 y Cartilla 2 tienen secuencias distintas en cada nivel LogMAR', () => {
    const c1 = CONFIG.CARTILLAS_ETDRS['Cartilla 1']!;
    const c2 = CONFIG.CARTILLAS_ETDRS['Cartilla 2']!;
    for (let i = 0; i < c1.length; i++) {
      expect(c1[i]).not.toBe(c2[i]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cartillas de Números — integridad
// ─────────────────────────────────────────────────────────────────────────────

describe('CARTILLAS_NUMEROS — integridad', () => {

  for (const [nombre, lineas] of Object.entries(CONFIG.CARTILLAS_NUMEROS)) {

    it(`${nombre}: tiene 17 líneas (una por cada valor en POSSIBLE_LOGMAR_VALUES)`, () => {
      expect(lineas).toHaveLength(17);
    });

    it(`${nombre}: cada línea tiene exactamente 5 dígitos`, () => {
      for (const linea of lineas) {
        expect(parsearLinea(linea)).toHaveLength(5);
      }
    });

    it(`${nombre}: no hay dígitos repetidos dentro de la misma línea`, () => {
      for (const linea of lineas) {
        const digitos = parsearLinea(linea);
        expect(new Set(digitos).size).toBe(digitos.length);
      }
    });

    it(`${nombre}: solo contiene dígitos 0–9`, () => {
      for (const linea of lineas) {
        for (const d of parsearLinea(linea)) {
          expect(DIGITOS_VALIDOS.has(d)).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Cartillas LEA — integridad
// ─────────────────────────────────────────────────────────────────────────────

describe('CARTILLAS_LEA — integridad de símbolos Hyvärinen', () => {

  for (const [nombre, lineas] of Object.entries(CONFIG.CARTILLAS_LEA)) {

    it(`${nombre}: tiene 10 líneas`, () => {
      expect(lineas).toHaveLength(10);
    });

    it(`${nombre}: cada línea tiene 8 símbolos`, () => {
      for (const linea of lineas) {
        expect(parsearLinea(linea)).toHaveLength(8);
      }
    });

    it(`${nombre}: solo usa símbolos LEA válidos (A, H, C, S)`, () => {
      for (const linea of lineas) {
        for (const s of parsearLinea(linea)) {
          expect(LEA_VALIDOS.has(s)).toBe(true);
        }
      }
    });

    it(`${nombre}: los 4 símbolos distintos aparecen al menos una vez`, () => {
      const encontrados = new Set(lineas.flatMap((l) => parsearLinea(l)));
      for (const s of LEA_VALIDOS) {
        expect(encontrados.has(s)).toBe(true);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cartillas Lighthouse — integridad
// ─────────────────────────────────────────────────────────────────────────────

describe('CARTILLAS_LIGHTHOUSE — integridad de símbolos Lighthouse', () => {

  for (const [nombre, lineas] of Object.entries(CONFIG.CARTILLAS_LIGHTHOUSE)) {

    it(`${nombre}: tiene 10 líneas`, () => {
      expect(lineas).toHaveLength(10);
    });

    it(`${nombre}: cada línea tiene 8 símbolos`, () => {
      for (const linea of lineas) {
        expect(parsearLinea(linea)).toHaveLength(8);
      }
    });

    it(`${nombre}: solo usa símbolos Lighthouse válidos (A, H, U)`, () => {
      for (const linea of lineas) {
        for (const s of parsearLinea(linea)) {
          expect(LIGHTHOUSE_VALIDOS.has(s)).toBe(true);
        }
      }
    });

    it(`${nombre}: los 3 símbolos distintos aparecen al menos una vez`, () => {
      const encontrados = new Set(lineas.flatMap((l) => parsearLinea(l)));
      for (const s of LIGHTHOUSE_VALIDOS) {
        expect(encontrados.has(s)).toBe(true);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Duo-Cromo — configuración
// ─────────────────────────────────────────────────────────────────────────────

describe('Duo-Cromo — configuración', () => {

  it('DUOCHROME_LETTERS está definido y es un string no vacío', () => {
    expect(typeof CONFIG.DUOCHROME_LETTERS).toBe('string');
    expect(CONFIG.DUOCHROME_LETTERS.trim().length).toBeGreaterThan(0);
  });

  it('duochromeInitialLogMar es 0.6 (20/80 — tamaño clínico para Duo-Cromo)', () => {
    expect(CONFIG.duochromeInitialLogMar).toBeCloseTo(0.6, 10);
  });
});
