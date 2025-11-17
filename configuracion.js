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
        
        console.log('Configuración cargada en el formulario.');
    }

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