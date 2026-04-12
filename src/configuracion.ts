/**
 * configuracion.ts — Lógica de la pantalla de configuración
 *
 * Lee/escribe ajustes en localStorage.
 * Lee CONFIG como valores por defecto cuando no hay valor guardado.
 */

import { CONFIG } from './config';
import { calcularTamanoLogMAR } from './chart_logic';

document.addEventListener('DOMContentLoaded', () => {
  // --- Referencias al DOM ---
  const form         = document.getElementById('config-form') as HTMLFormElement;
  const statusMsg    = document.getElementById('status-message')!;

  const anchoPantallaCm       = document.getElementById('anchoPantallaCm')        as HTMLInputElement;
  const resolucionAnchoPx     = document.getElementById('resolucionAnchoPx')       as HTMLInputElement;
  const distanciaMetros       = document.getElementById('distanciaMetros')         as HTMLInputElement;
  const valorLogMarInicial    = document.getElementById('valorLogMarInicial')      as HTMLInputElement;
  const duochromeInitialLogMar = document.getElementById('duochromeInitialLogMar') as HTMLInputElement;
  const duochromeTargetScale   = document.getElementById('duochromeTargetScale')   as HTMLInputElement;
  const duochromeLetterLines   = document.getElementById('duochromeLetterLines')   as HTMLInputElement;
  const calibrationFactor      = document.getElementById('calibrationFactor')      as HTMLInputElement;
  const referenceList          = document.getElementById('reference-list')!;
  const logmarCheckboxesContainer = document.getElementById('logmar-checkboxes')!;

  // --- Referencias a las nuevas herramientas de calibración ---
  const letterPreviewBox   = document.getElementById('letter-preview-box') as HTMLElement;
  const letterPreviewLabel = document.getElementById('letter-preview-label')!;
  const calibrationStats   = document.getElementById('calibration-stats')!;
  const measuredSizeInput  = document.getElementById('measured-size') as HTMLInputElement;
  const autoCalibrateBtn   = document.getElementById('auto-calibrate-btn')!;
  const calibrationWarning = document.getElementById('calibration-warning')!;

  // --- Vista previa de letra en tiempo real (calibración clínica) ---
  // Renderiza una caja con el tamaño real en píxeles para LogMAR 1.0.
  // El usuario puede medirla con regla y usar "Auto-calibrar".
  function updateLivePreview(): void {
    const dist   = parseFloat(distanciaMetros.value)    || CONFIG.distanciaMetros;
    const ancho  = parseFloat(anchoPantallaCm.value)    || CONFIG.anchoPantallaCm;
    const resol  = parseFloat(resolucionAnchoPx.value)  || getResolucionLogicaCSS();
    const factor = parseFloat(calibrationFactor.value)  || 1.0;

    // Tamaño físico esperado: solo depende de geometría (distancia + LogMAR 1.0)
    // Referencia: ISO 8596:2009 — Ferris et al. 1982
    const marMin     = Math.pow(10, 1.0); // 10 arcminutos
    const angleRad   = (marMin * 5 / 60) * (Math.PI / 180);
    const expectedCm = dist * 100 * Math.tan(angleRad);

    // Tamaño en píxeles calculado con la configuración actual
    const sizePx = calcularTamanoLogMAR(1.0, {
      distanciaMetros: dist,
      anchoPantallaCm: ancho,
      resolucionAnchoPx: resol,
      calibrationFactor: factor,
    });

    // Cuántas letras cabrían con este tamaño (clínico: contexto de cantidad)
    const available = window.innerWidth * 0.88;
    const maxFit    = Math.max(1, Math.min(8, Math.floor((available + sizePx) / (2 * sizePx))));

    // Actualizar caja de preview (clampear para que no desborde)
    const clampedPx = Math.min(Math.max(sizePx, 6), window.innerWidth * 0.8);
    if (letterPreviewBox) {
      letterPreviewBox.style.height = `${clampedPx}px`;
      letterPreviewBox.style.width  = `${clampedPx}px`;
    }

    // Etiqueta descriptiva
    letterPreviewLabel.innerHTML =
      `LogMAR 1.0 · distancia <strong>${dist.toFixed(1)} m</strong> → ` +
      `tamaño esperado: <strong>${expectedCm.toFixed(2)} cm</strong> · ` +
      `calculado: <strong>${sizePx.toFixed(0)} px</strong> · ` +
      `letras en pantalla: <strong>${maxFit}</strong>`;

    // Estadísticas de densidad
    const pxPerCm         = resol / ancho;
    const detectedPxPerCm = getResolucionLogicaCSS() / ancho;
    calibrationStats.textContent =
      `Densidad configurada: ${pxPerCm.toFixed(1)} px/cm · ` +
      `Densidad detectada: ${detectedPxPerCm.toFixed(1)} px/cm`;

    // Advertencia si la resolución configurada difiere de la CSS detectada (DPI bug)
    const cssWidth = getResolucionLogicaCSS();
    const resRatio = resol / cssWidth;
    if (Math.abs(resRatio - 1) > 0.05) {
      calibrationWarning.style.display = 'block';
      calibrationWarning.innerHTML =
        `⚠️ La resolución configurada (<strong>${Math.round(resol)} px</strong>) ` +
        `difiere de la resolución CSS detectada (<strong>${cssWidth} px</strong>). ` +
        `Esto causará optotipos incorrectos. Usa <strong>${cssWidth} px</strong>.`;
    } else {
      calibrationWarning.style.display = 'none';
    }
  }

  // --- Auto-calibración a partir de medición física ---
  // El usuario mide la caja de preview con una regla.
  // calibrationFactor_nuevo = factor_actual × (esperado_cm / medido_cm)
  function autoCalibrate(): void {
    const measured = parseFloat(measuredSizeInput.value);
    if (!measured || measured <= 0) {
      alert('Ingresa la medida real de la caja en centímetros.');
      return;
    }
    const dist       = parseFloat(distanciaMetros.value) || CONFIG.distanciaMetros;
    const marMin     = Math.pow(10, 1.0);
    const angleRad   = (marMin * 5 / 60) * (Math.PI / 180);
    const expectedCm = dist * 100 * Math.tan(angleRad);

    const currentFactor  = parseFloat(calibrationFactor.value) || 1.0;
    const correctedFactor = currentFactor * (expectedCm / measured);
    calibrationFactor.value = correctedFactor.toFixed(3);
    updateLivePreview();
    updateReferenceTable();

    statusMsg.textContent = `Factor ajustado a ${correctedFactor.toFixed(3)} · Guarda los cambios.`;
    statusMsg.style.color = '#0066cc';
    setTimeout(() => { statusMsg.textContent = ''; }, 5000);
  }

  // --- Tabla de referencia de tamaños ---
  function updateReferenceTable(): void {
    const dist = parseFloat(distanciaMetros.value) || 6.0;
    const sizes = [
      { log: 1.0, snellen: '20/200' },
      { log: 0.7, snellen: '20/100' },
      { log: 0.0, snellen: '20/20'  },
    ];
    referenceList.innerHTML = sizes.map(({ log, snellen }) => {
      const marMin   = Math.pow(10, log);
      const angleRad = ((marMin * 5) / 60) * (Math.PI / 180);
      const sizeCm   = (dist * 100) * Math.tan(angleRad);
      return `<li>LogMAR ${log} (${snellen}): La letra debe medir <strong>${sizeCm.toFixed(2)} cm</strong> de alto.</li>`;
    }).join('');
  }

  // --- Checkboxes de líneas LogMAR ---
  function loadLogMarCheckboxes(): void {
    const savedEnabled: number[] = JSON.parse(
      localStorage.getItem('enabledLogMarValues') ?? 'null',
    ) ?? [...CONFIG.DEFAULT_ENABLED_LOGMAR];

    logmarCheckboxesContainer.innerHTML = '';
    CONFIG.POSSIBLE_LOGMAR_VALUES.forEach((val) => {
      const wrapper  = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.value   = String(val);
      checkbox.id      = `cb-${val}`;
      checkbox.checked = savedEnabled.some((s) => Math.abs(s - val) < 0.001);

      const label = document.createElement('label');
      label.htmlFor   = `cb-${val}`;
      label.textContent = val.toFixed(1);
      label.style.marginLeft = '5px';

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      logmarCheckboxesContainer.appendChild(wrapper);
    });
  }

  function getEnabledLogMarValues(): number[] {
    const checkboxes = logmarCheckboxesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    return Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => parseFloat(cb.value))
      .sort((a, b) => b - a);
  }

  // --- Detección HiDPI / Retina (clínico #2.2) ---
  // La resolución que debe ingresarse es la LÓGICA (CSS), no la física del panel.
  // En pantallas Retina/4K con DPR>1, la resolución física es DPR × resolución CSS.
  // Usar la resolución física causaría optotipos hasta 2× más grandes de lo correcto.
  function getResolucionLogicaCSS(): number {
    return window.innerWidth; // píxeles CSS lógicos (independiente del DPR)
  }

  function renderHiDPIHint(): void {
    const dpr       = window.devicePixelRatio ?? 1;
    const cssWidth  = getResolucionLogicaCSS();
    const physWidth = Math.round(cssWidth * dpr);
    const hintEl    = document.getElementById('hidpi-hint');
    if (!hintEl) return;
    if (dpr > 1) {
      hintEl.innerHTML =
        `⚠️ <strong>Pantalla HiDPI detectada (DPR=${dpr.toFixed(1)})</strong>: ` +
        `Resolución física: <strong>${physWidth} px</strong> — ` +
        `Resolución CSS lógica: <strong>${cssWidth} px</strong>. ` +
        `<strong>Usa ${cssWidth} px</strong> (NO uses ${physWidth} px; causaría optotipos ${dpr}× más grandes).`;
      hintEl.style.display = 'block';
    } else {
      hintEl.innerHTML =
        `✅ Pantalla estándar (DPR=1). Resolución CSS = resolución física: <strong>${cssWidth} px</strong>.`;
      hintEl.style.display = 'block';
    }
  }

  // --- Cargar ajustes ---
  function loadSettings(): void {
    // Si no hay valor guardado, pre-rellenar con resolución CSS lógica detectada
    const savedResolucion = localStorage.getItem('resolucionAnchoPx');
    anchoPantallaCm.value        = localStorage.getItem('anchoPantallaCm')        ?? String(CONFIG.anchoPantallaCm);
    resolucionAnchoPx.value      = savedResolucion                                ?? String(getResolucionLogicaCSS());
    distanciaMetros.value        = localStorage.getItem('distanciaMetros')        ?? String(CONFIG.distanciaMetros);
    valorLogMarInicial.value     = localStorage.getItem('valorLogMarInicial')     ?? String(CONFIG.valorLogMarInicial);
    duochromeInitialLogMar.value = localStorage.getItem('duochromeInitialLogMar') ?? String(CONFIG.duochromeInitialLogMar);
    duochromeTargetScale.value   = localStorage.getItem('duochromeTargetScale')   ?? String(CONFIG.duochromeTargetScale);
    duochromeLetterLines.value   = localStorage.getItem('duochromeLetterLines')   ?? String(CONFIG.duochromeLetterLines);
    calibrationFactor.value      = localStorage.getItem('calibrationFactor')      ?? String(CONFIG.calibrationFactor);
    loadLogMarCheckboxes();
    updateReferenceTable();
    renderHiDPIHint();
    updateLivePreview();
  }

  // --- Guardar ajustes ---
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      localStorage.setItem('anchoPantallaCm',        anchoPantallaCm.value);
      localStorage.setItem('resolucionAnchoPx',      resolucionAnchoPx.value);
      localStorage.setItem('distanciaMetros',        distanciaMetros.value);
      localStorage.setItem('valorLogMarInicial',     valorLogMarInicial.value);
      localStorage.setItem('duochromeInitialLogMar', duochromeInitialLogMar.value);
      localStorage.setItem('duochromeTargetScale',   duochromeTargetScale.value);
      localStorage.setItem('duochromeLetterLines',   duochromeLetterLines.value);
      localStorage.setItem('calibrationFactor',      calibrationFactor.value);

      const enabledLines = getEnabledLogMarValues();
      if (enabledLines.length === 0) {
        alert('¡Debes seleccionar al menos una línea LogMAR!');
        return;
      }
      localStorage.setItem('enabledLogMarValues', JSON.stringify(enabledLines));

      statusMsg.textContent = '¡Guardado con éxito!';
      statusMsg.style.color = 'green';
      setTimeout(() => { statusMsg.textContent = ''; }, 3000);
    } catch (error) {
      statusMsg.textContent = 'Error al guardar. ¿Almacenamiento lleno?';
      statusMsg.style.color = 'red';
      console.error('Error al guardar en localStorage:', error);
    }
  });

  distanciaMetros.addEventListener('input', () => { updateReferenceTable(); updateLivePreview(); });
  anchoPantallaCm.addEventListener('input', updateLivePreview);
  resolucionAnchoPx.addEventListener('input', updateLivePreview);
  calibrationFactor.addEventListener('input', updateLivePreview);
  autoCalibrateBtn.addEventListener('click', autoCalibrate);
  loadSettings();
});
