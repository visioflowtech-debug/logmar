# Sistema Visual Completo (LogMAR Pro)

Una aplicación web completa para pruebas de agudeza visual, diseñada para profesionales de la salud visual. Incluye cartillas ETDRS, Snellen, pruebas de astigmatismo, Duo-Cromo y más.

## Características Principales

*   **Cartillas LogMAR y Snellen**: Escalamiento preciso basado en la distancia y tamaño de pantalla configurados.
*   **Múltiples Optotipos**: Letras (Sloan), Números, y soporte para otros tipos.
*   **Pruebas Especiales**:
    *   Duo-Cromo (Rojo/Verde)
    *   Reloj Astigmático
    *   Test de Worth (Luces)
    *   Rejilla de Amsler
*   **Control Remoto**: Funcionalidad de control remoto vía web (PeerJS) escaneando un código QR.
*   **Modo Espejo**: Para consultorios con espejos.
*   **Aleatorización**: Evita que los pacientes memoricen las líneas.
*   **Calibración**: Ajuste fino de tamaño de pantalla y resolución.

## Instalación y Uso

1.  Clona este repositorio o descarga los archivos.
2.  Abre el archivo `index.html` en un navegador web moderno (Chrome, Firefox, Edge).
3.  **Configuración Inicial**:
    *   Haz clic en el icono de engranaje (⚙️) para abrir la configuración.
    *   Ingresa la distancia de prueba (metros) y el ancho de tu pantalla (cm).
    *   Guarda los cambios.

## Atajos de Teclado

*   **Flecha Arriba / Abajo**: Cambiar tamaño (LogMAR).
*   **Flecha Izquierda / Derecha**: Cambiar optotipo / prueba.
*   **R**: Aleatorizar optotipos.
*   **M**: Alternar Modo Espejo.

## Control Remoto

1.  Haz clic en el icono del teléfono (📱) en la pantalla principal.
2.  Escanea el código QR con tu dispositivo móvil o ingresa a la URL mostrada.
3.  Usa la interfaz web en tu móvil para controlar la cartilla a distancia.

## Estructura de Archivos

*   `index.html`: Punto de entrada principal.
*   `main.js`: Lógica principal de la aplicación.
*   `chart_logic.js`: Cálculos matemáticos para el tamaño de optotipos.
*   `config.js`: Configuración por defecto.
*   `remote.html` / `remote.js`: Interfaz y lógica del control remoto.
*   `style.css`: Estilos generales.


## Generar Versión Protegida (Build)

Para generar una versión ofuscada y lista para distribución:

1.  Asegúrate de tener **Node.js** instalado.
2.  Ejecuta el script de construcción:
    ```bash
    node build_obfuscate.js
    ```
3.  Esto creará una carpeta `dist/`.
4.  **Distribuye únicamente el contenido de la carpeta `dist/`** a tus clientes.

## Licencia

Este software requiere una clave de licencia válida para su uso.

