Ejecuta una auditoría completa de LogMAR Pro usando el agente `auditor`.

Revisa los siguientes archivos en este orden:
1. `license.js` — seguridad del sistema de licencias
2. `main.js` — variables globales, manejo de errores, código debug
3. `chart_logic.js` — integridad de fórmulas médicas (calcular valores esperados)
4. `style.css` — detectar duplicados
5. `config.js` — integridad de datos de cartillas
6. `configuracion.js` — validación de inputs

Para cada archivo:
- Lee el contenido completo
- Aplica el protocolo de auditoría definido en el agente `auditor`
- Clasifica hallazgos como 🔴 Crítico / 🟡 Importante / 🟢 Menor

Al final, presenta el reporte completo con:
- Lista de hallazgos nuevos (no los problemas ya documentados en CLAUDE.md)
- Score de salud del código (0-10) por categoría
- Una sola recomendación prioritaria de acción inmediata
