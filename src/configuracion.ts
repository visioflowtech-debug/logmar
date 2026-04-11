/**
 * configuracion.ts — Lógica de la pantalla de configuración
 *
 * Lee/escribe ajustes en localStorage.
 * Lee CONFIG como valores por defecto cuando no hay valor guardado.
 */

import { CONFIG } from './config';

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

  // --- Cargar ajustes ---
  function loadSettings(): void {
    anchoPantallaCm.value        = localStorage.getItem('anchoPantallaCm')        ?? String(CONFIG.anchoPantallaCm);
    resolucionAnchoPx.value      = localStorage.getItem('resolucionAnchoPx')      ?? String(CONFIG.resolucionAnchoPx);
    distanciaMetros.value        = localStorage.getItem('distanciaMetros')        ?? String(CONFIG.distanciaMetros);
    valorLogMarInicial.value     = localStorage.getItem('valorLogMarInicial')     ?? String(CONFIG.valorLogMarInicial);
    duochromeInitialLogMar.value = localStorage.getItem('duochromeInitialLogMar') ?? String(CONFIG.duochromeInitialLogMar);
    duochromeTargetScale.value   = localStorage.getItem('duochromeTargetScale')   ?? String(CONFIG.duochromeTargetScale);
    duochromeLetterLines.value   = localStorage.getItem('duochromeLetterLines')   ?? String(CONFIG.duochromeLetterLines);
    calibrationFactor.value      = localStorage.getItem('calibrationFactor')      ?? String(CONFIG.calibrationFactor);
    loadLogMarCheckboxes();
    updateReferenceTable();
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

  distanciaMetros.addEventListener('input', updateReferenceTable);
  loadSettings();
});
