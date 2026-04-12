Genera y ejecuta tests para LogMAR Pro usando el agente `tester`.

## Paso 1: Verificar setup
Comprueba si ya existe un directorio `tests/` y si Vitest/Jest están instalados en `package.json`.

## Paso 2: Si NO hay setup de testing
1. Instala Vitest: `npm install --save-dev vitest`
2. Agrega al `package.json`: `"test": "vitest run"` y `"test:watch": "vitest"`
3. Crea el directorio `tests/`

## Paso 3: Generar tests críticos
Crea o actualiza `tests/chart_logic.test.js` con TODOS los tests definidos en el agente `tester`:
- Tests de `calcularTamanoLogMAR` (valores numéricos clínicamente validados)
- Tests de `convertirLogMarASnellen` (conversiones conocidas)
- Tests de integridad de cartillas ETDRS/LEA/Lighthouse

## Paso 4: Ejecutar tests
```bash
npm test
```

## Paso 5: Reportar
Muestra:
- Cuántos tests pasaron / fallaron
- Si algún test falla, analiza por qué (¿bug real o test incorrecto?)
- Cobertura de código si está disponible
- Próximos tests recomendados para aumentar cobertura
