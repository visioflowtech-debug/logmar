// En: chart_logic.js
// Contiene las funciones matemáticas CORREGIDAS.

/**
 * Calcula el tamaño en PÍXELES para un valor LogMAR dado.
 * ESTA ES LA FÓRMULA CORREGIDA.
 */
function calcularTamanoLogMAR(valorLogMar, config) {
    // config.calibrationFactor se usa para corregir errores de DPI o métricas de fuente.
    const factor = config.calibrationFactor || 1.0;

    // 1. Calcular el "Ángulo Mínimo de Resolución" (MAR) para el LogMAR dado.
    //    MAR (en minutos de arco) = 10 elevado al valor LogMAR.
    //    Ej: 0.0 LogMAR = 10^0.0 = 1 minuto de arco (base 20/20)
    //    Ej: 1.0 LogMAR = 10^1.0 = 10 minutos de arco (base 20/200)
    const marEnMinutosDeArco = Math.pow(10, valorLogMar);

    // 2. Convertir ese ángulo a grados.
    const marEnGrados = marEnMinutosDeArco / 60;

    // 3. Convertir grados a radianes (que es lo que usa Math.tan).
    const marEnRadianes = marEnGrados * (Math.PI / 180);

    // 4. Obtener la distancia en cm.
    const distanciaCm = config.distanciaMetros * 100;

    // 5. Calcular el tamaño físico.
    //    Un optotipo estándar (como una 'C' o 'E') subtiende un ángulo 5 veces mayor que su MAR.
    //    Fórmula correcta: Tamaño = Distancia * tan(5 * MAR)
    const anguloOptotipoRadianes = marEnRadianes * 5;
    const tamanoOptotipoCm = distanciaCm * Math.tan(anguloOptotipoRadianes);


    // 6. Calcular los píxeles por centímetro de tu monitor.
    const pixelsPerCm = config.resolucionAnchoPx / config.anchoPantallaCm;

    // 7. Convertir el tamaño de cm a píxeles.
    const tamanoFinalPx = tamanoOptotipoCm * pixelsPerCm;

    return tamanoFinalPx * factor;
}

/**
 * Convierte un valor LogMAR a su equivalente en Fracción de Snellen (base 20).
 * (Esta función ya era correcta).
 */
function convertirLogMarASnellen(valorLogMar) {
    // Fórmula: Denominador = 20 * (10 ^ valorLogMar)
    const denominador = 20 * Math.pow(10, valorLogMar);

    // Redondeamos el denominador para que se vea limpio
    return `20/${Math.round(denominador)}`;
}