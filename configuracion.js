// En: configuracion.js

// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Referencias a los elementos del formulario ---
    const form = document.getElementById('config-form');
    const statusMessage = document.getElementById('status-message');

    // Inputs
    const anchoPantallaCm = document.getElementById('anchoPantallaCm');
    const resolucionAnchoPx = document.getElementById('resolucionAnchoPx');
    const distanciaMetros = document.getElementById('distanciaMetros');
    const valorLogMarInicial = document.getElementById('valorLogMarInicial');
    const duochromeInitialLogMar = document.getElementById('duochromeInitialLogMar');
    const calibrationFactor = document.getElementById('calibrationFactor');
    const referenceList = document.getElementById('reference-list');
    const logmarCheckboxesContainer = document.getElementById('logmar-checkboxes');

    // --- 2. Función para CARGAR los ajustes ---
    function loadSettings() {
        // Para cada ajuste:
        // 1. Intenta leerlo de localStorage.
        // 2. Si no existe (es 'null'), usa el valor de CONFIG (config.js).
        anchoPantallaCm.value = localStorage.getItem('anchoPantallaCm') || CONFIG.anchoPantallaCm;
        resolucionAnchoPx.value = localStorage.getItem('resolucionAnchoPx') || CONFIG.resolucionAnchoPx;
        distanciaMetros.value = localStorage.getItem('distanciaMetros') || CONFIG.distanciaMetros;
        valorLogMarInicial.value = localStorage.getItem('valorLogMarInicial') || CONFIG.valorLogMarInicial;
        duochromeInitialLogMar.value = localStorage.getItem('duochromeInitialLogMar') || CONFIG.duochromeInitialLogMar;
        calibrationFactor.value = localStorage.getItem('calibrationFactor') || CONFIG.calibrationFactor;

        loadLogMarCheckboxes(); // Cargar checkboxes
        updateReferenceTable(); // Actualizar tabla al cargar
        console.log('Configuración cargada en el formulario.');
    }

    // --- Función Auxiliar: Cargar Checkboxes ---
    function loadLogMarCheckboxes() {
        const savedEnabled = JSON.parse(localStorage.getItem('enabledLogMarValues')) || CONFIG.DEFAULT_ENABLED_LOGMAR;

        logmarCheckboxesContainer.innerHTML = '';
        CONFIG.POSSIBLE_LOGMAR_VALUES.forEach(val => {
            const wrapper = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = val;
            checkbox.id = `cb-${val}`;
            // Comparamos con un pequeño margen por si hay errores de flotante, aunque aquí son exactos
            checkbox.checked = savedEnabled.some(saved => Math.abs(saved - val) < 0.001);

            const label = document.createElement('label');
            label.htmlFor = `cb-${val}`;
            label.textContent = val.toFixed(1);
            label.style.marginLeft = '5px';

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            logmarCheckboxesContainer.appendChild(wrapper);
        });
    }

    // --- Función Auxiliar: Obtener valores seleccionados ---
    function getEnabledLogMarValues() {
        const checkboxes = logmarCheckboxesContainer.querySelectorAll('input[type="checkbox"]');
        const enabled = [];
        checkboxes.forEach(cb => {
            if (cb.checked) {
                enabled.push(parseFloat(cb.value));
            }
        });
        // Ordenar de mayor a menor (1.3 -> -0.3)
        return enabled.sort((a, b) => b - a);
    }

    // --- Función Auxiliar: Calcular tamaños esperados ---
    function updateReferenceTable() {
        const dist = parseFloat(distanciaMetros.value) || 6.0;

        // Fórmula: Tamaño = Distancia * tan(5 * MAR)
        // MAR 1.0 (20/200) = 10 min arc
        // MAR 0.0 (20/20) = 1 min arc

        const sizes = [
            { log: 1.0, snellen: "20/200" },
            { log: 0.7, snellen: "20/100" },
            { log: 0.0, snellen: "20/20" }
        ];

        let html = "";
        sizes.forEach(item => {
            const marMin = Math.pow(10, item.log);
            const angleDeg = (marMin * 5) / 60;
            const angleRad = angleDeg * (Math.PI / 180);
            const sizeCm = (dist * 100) * Math.tan(angleRad);

            html += `<li>LogMAR ${item.log} (${item.snellen}): La letra debe medir <strong>${sizeCm.toFixed(2)} cm</strong> de alto.</li>`;
        });

        referenceList.innerHTML = html;
    }

    // Actualizar tabla cuando cambia la distancia
    distanciaMetros.addEventListener('input', updateReferenceTable);

    // --- 3. Función para GUARDAR los ajustes ---
    form.addEventListener('submit', (event) => {
        // Evita que la página se recargue
        event.preventDefault();

        try {
            // Guarda cada valor del formulario en localStorage
            localStorage.setItem('anchoPantallaCm', anchoPantallaCm.value);
            localStorage.setItem('resolucionAnchoPx', resolucionAnchoPx.value);
            localStorage.setItem('distanciaMetros', distanciaMetros.value);
            localStorage.setItem('valorLogMarInicial', valorLogMarInicial.value);
            localStorage.setItem('duochromeInitialLogMar', duochromeInitialLogMar.value);
            localStorage.setItem('calibrationFactor', calibrationFactor.value);

            // Guardar lista de líneas habilitadas
            const enabledLines = getEnabledLogMarValues();
            if (enabledLines.length === 0) {
                alert("¡Debes seleccionar al menos una línea LogMAR!");
                return;
            }
            localStorage.setItem('enabledLogMarValues', JSON.stringify(enabledLines));

            // Muestra un mensaje de éxito
            statusMessage.textContent = '¡Guardado con éxito!';
            statusMessage.style.color = 'green';

            // Borra el mensaje después de 3 segundos
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 3000);

        } catch (error) {
            // Muestra un mensaje de error
            statusMessage.textContent = 'Error al guardar. ¿Almacenamiento lleno?';
            statusMessage.style.color = 'red';
            console.error('Error al guardar en localStorage:', error);
        }
    });

    // --- 4. Carga inicial ---
    // Carga los ajustes en el formulario tan pronto como la página se abre
    loadSettings();
});