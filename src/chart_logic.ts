/**
 * chart_logic.ts — Motor matemático LogMAR (ISO 8596:2009)
 *
 * CRÍTICO: Estas fórmulas son clínicamente validadas.
 * NO modificar sin revisión del agente `clinico` y verificación numérica.
 *
 * Referencias:
 *   - ISO 8596:2009 — Optotypes for the determination of visual acuity
 *   - Bailey & Lovie (1976) — New design principles for visual acuity letter charts
 *   - Ferris et al. (1982) — New visual acuity charts for clinical research
 */

import type { ScreenConfig } from './types';

/**
 * Calcula el tamaño en PÍXELES para un valor LogMAR dado.
 *
 * Derivación (ISO 8596:2009):
 *   MAR (arcmin) = 10^LogMAR
 *   Tamaño (cm)  = distancia_cm × tan(5 × MAR_rad)
 *   Píxeles      = tamaño_cm × (resoluciónPx / anchoCm) × calibrationFactor
 *
 * Valor canónico: calcularTamanoLogMAR(0.0, { 6m, 1920px, 52.5cm, 1.0 }) ≈ 31.91 px
 */
export function calcularTamanoLogMAR(valorLogMar: number, config: ScreenConfig): number {
  const factor = config.calibrationFactor ?? 1.0;

  // 1. MAR en minutos de arco = 10^LogMAR
  const marEnMinutosDeArco = Math.pow(10, valorLogMar);

  // 2. Convertir a radianes (MAR/60 → grados → radianes)
  const marEnRadianes = (marEnMinutosDeArco / 60) * (Math.PI / 180);

  // 3. El optotipo subtende 5 × MAR (ISO 8596)
  const anguloOptotipoRadianes = marEnRadianes * 5;

  // 4. Tamaño físico en cm
  const distanciaCm = config.distanciaMetros * 100;
  const tamanoOptotipoCm = distanciaCm * Math.tan(anguloOptotipoRadianes);

  // 5. Convertir a píxeles según densidad del monitor
  const pixelsPerCm = config.resolucionAnchoPx / config.anchoPantallaCm;

  return tamanoOptotipoCm * pixelsPerCm * factor;
}

/**
 * Convierte un valor LogMAR a fracción Snellen (base 20).
 * Denominador = 20 × 10^LogMAR
 */
export function convertirLogMarASnellen(valorLogMar: number): string {
  const denominador = 20 * Math.pow(10, valorLogMar);
  return `20/${Math.round(denominador)}`;
}
