Ejecuta una validación científica completa de LogMAR Pro usando el agente `clinico`.

El agente actúa como experto en optometría clínica, física óptica y refracción. Toda observación estará respaldada por normas ISO, publicaciones peer-reviewed o guías de organizaciones internacionales (ICO, AOA, AAO).

## Lo que se evalúa

### 1. Fórmulas matemáticas (chart_logic.js)
Verifica que `calcularTamanoLogMAR` y `convertirLogMarASnellen` sean clínicamente exactas:
- Calcula el tamaño esperado para LogMAR 0.0, 0.3, 0.7, 1.0 a la distancia configurada
- Compara con tabla de referencia (ISO 8596:2009)
- Reporta si hay desviación > 2%

### 2. Optotipos y cartillas (config.js)
- ¿El conjunto de letras Sloan es correcto? (C, D, H, K, N, O, R, S, V, Z)
- ¿Los símbolos LEA son los 4 validados por Hyvärinen?
- ¿Los símbolos Lighthouse corresponden al set de Allen figures?
- ¿La progresión entre líneas es de 0.1 log units?

### 3. Tests especiales
- Duo-Cromo: principio de aberración cromática — ¿implementación correcta?
- Reloj de Astigmatismo: 12 meridianos a 30° — ¿correcto?
- Test de Worth: colores correctos para filtros rojo-verde — ¿correcto?
- Rejilla de Amsler: distancia de uso y cobertura angular — ¿correcto?

### 4. Condiciones clínicas de uso
¿La aplicación advierte al clínico sobre:
- Necesidad de calibración de pantalla antes del primer uso?
- Distancia correcta para cada test?
- Requerimiento de filtros para Worth y Duo-Cromo?
- Que es herramienta de apoyo, no diagnóstico definitivo?

## Formato de resultado

El agente entregará:
1. **Dictamen general** (Aprobado / Aprobado con observaciones / No aprobado)
2. **Tabla de conformidad** con estándares ISO, ETDRS, ICO
3. **Lista de hallazgos** con fuente científica específica por cada uno
4. **Condiciones de uso clínico aceptable**
5. **Próximas acciones** ordenadas por impacto clínico
