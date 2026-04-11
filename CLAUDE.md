# LogMAR Pro — Guía de Proyecto para Agentes Claude

## ¿Qué es este proyecto?

**LogMAR Pro** es una aplicación web de optometría clínica para realizar pruebas de agudeza visual digitales en consultorios médicos. Reemplaza las cartillas impresas tradicionales con una pantalla calibrada que calcula matemáticamente el tamaño correcto de los optotipos según la distancia y resolución del monitor.

**Versión actual:** 1.3.0  
**Deploy:** Vercel (estático)  
**Repositorio:** `c:\logmar` / rama principal: `main`

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript ES6+ |
| Comunicación remoto | PeerJS 1.5.2 (CDN) |
| Licencias | Google Apps Script (API externa) |
| QR codes | api.qrserver.com (CDN externo) |
| Build | javascript-obfuscator (Node.js) |
| Hosting | Vercel |

**Sin framework.** Sin TypeScript. Sin bundler (Vite/Webpack). Todo es JS puro.

---

## Estructura de Archivos

```
c:\logmar\
├── index.html          # Pantalla principal de tests (entry point)
├── remote.html         # Interfaz de control remoto (móvil)
├── configuracion.html  # Pantalla de configuración/calibración
├── main.js             # Lógica principal (744 líneas) — estado, teclado, PeerJS
├── chart_logic.js      # Motor matemático LogMAR (53 líneas) — CRÍTICO
├── config.js           # Configuración por defecto (89 líneas)
├── configuracion.js    # Gestión de settings (153 líneas)
├── remote.js           # Lógica del control remoto (103 líneas)
├── license.js          # Sistema de licencias (125 líneas)
├── style.css           # Estilos principales (652 líneas — contiene ~120 líneas duplicadas)
├── configuracion.css   # Estilos de configuración (90 líneas)
├── package.json        # Dependencias Node (solo javascript-obfuscator)
├── build_obfuscate.js  # Script de build/ofuscación
├── vercel.json         # Config de deploy
├── Optician-Sans.ttf   # Fuente especial para optotipos ETDRS
└── dist/               # Build ofuscado (producción)
```

---

## Arquitectura del Sistema

### Flujo de Datos
```
Usuario (teclado/remoto) → Event Listener (main.js)
    → settings object (estado global)
    → calcularTamanoLogMAR() (chart_logic.js)
    → DOM manipulation (renderizado)
    → localStorage (persistencia)
```

### Estado Global (main.js)
- **`settings`** — objeto global con toda la configuración leída de localStorage/CONFIG
- **`valorLogMarActual`** — valor LogMAR actual mostrado (float)
- **`indiceModoActual`** — índice del modo de test activo
- **`randomizedLines`** — letras aleatorizadas por línea LogMAR

### Modos de Test Disponibles (8 total)
1. `Cartilla 1` / `Cartilla 2` — Letras Sloan (ETDRS): C D H K N O R S V Z
2. `Numeros 1` — Números 0-9
3. `LEA Pediátrica 1` — Símbolos LEA (A=manzana, H=casa, C=círculo, S=cuadrado)
4. `Lighthouse 1` — Símbolos Lighthouse (A=manzana, H=casa, U=sombrilla)
5. `Duo-Cromo` — Test de refracción rojo/verde
6. `Reloj Astigmático` — 12 meridianos
7. `Test de Worth` — Fusión de colores (rojo, verde, blanco)
8. `Rejilla de Amsler` — Screening de degeneración macular

### Control Remoto
- PeerJS: móvil (remote.html) se conecta a pantalla principal (index.html)
- ID de 4 caracteres generado en cada sesión: `logmar-app-XXXX`
- Comandos: `increase_size`, `decrease_size`, `next_optotype`, `prev_optotype`, `randomize`, `toggle_mirror`, `toggle_red_green`, `set_mode`, `set_type`

---

## Fórmulas Matemáticas Críticas (chart_logic.js)

### calcularTamanoLogMAR(valorLogMar, config)
```javascript
// MAR = 10^LogMAR (minutos de arco)
// Ángulo optotipo = 5 × MAR (el optotipo subtiende 5 veces su MAR)
// Tamaño (cm) = Distancia (cm) × tan(5 × MAR en radianes)
// Píxeles = Tamaño (cm) × (resoluciónPx / anchoPantallaCm) × calibrationFactor
```

### convertirLogMarASnellen(valorLogMar)
```javascript
// Denominador Snellen = 20 × 10^LogMAR
// Resultado: "20/X"
```

**IMPORTANTE:** Estas fórmulas son clínicamente correctas y validadas. No modificar sin revisión oftalmológica.

---

## Sistema de Licencias

- **Implementación actual:** localStorage + Google Apps Script
- **Bypass trivial conocido:** `localStorage.setItem('logmar_license_active', 'true')`
- **Endpoint expuesto:** URL de Google Apps Script hardcodeada en `license.js:5`
- **Pendiente:** Migrar a validación server-side con tokens firmados (Fase B)

---

## Problemas Conocidos (Priorizados)

### 🔴 Críticos (Fase B — seguridad)
1. **`license.js:5`** — URL de Google Apps Script expuesta en código fuente
2. **`license.js:31`** — Licencia bypasseable via `localStorage`
3. **Cero tests** — `chart_logic.js` sin cobertura (Fase C)

### 🟡 Importantes (Fase C/D)
4. **`style.css:245-366`** — ~120 líneas CSS exactamente duplicadas
5. **`main.js`** — 70+ variables/funciones en scope global
6. **Elementos debug en UI** — `debug-distancia`, `debug-ancho`, `debug-resolucion` visibles en producción
7. **Sin `package-lock.json`** — builds no reproducibles
8. **`dist/` en git** — confusión entre fuente y build

### 🟢 Deuda técnica (Fase D+)
9. Magic numbers hardcodeados (`10 -` en `main.js:166`)
10. Nombres mezclados ES/EN
11. Sin ARIA/accesibilidad
12. Sin error tracking centralizado

---

## Convenciones del Proyecto

### Naming
- Variables/funciones: `camelCase` en español (ej: `valorLogMarActual`, `actualizarPantalla`)
- Constantes: `UPPER_SNAKE_CASE` (ej: `SLOAN_LETTERS`, `CARTILLAS_ETDRS`)
- IDs HTML: `kebab-case` (ej: `etdrs-chart`, `info-logmar`)
- Mezcla ES/EN es intencional por términos médicos internacionales

### Persistencia
- Toda configuración de usuario en `localStorage`
- Claves de localStorage: sin prefijo especial (ej: `'anchoPantallaCm'`, `'calibrationFactor'`)
- Estado de licencia: `'logmar_license_active'` = `'true'`

### Control de Versiones
- Versionado semántico en `package.json`
- Cache busting manual via query string `?v=N` (pendiente automatizar)

---

## Roadmap de Fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| **A** | CLAUDE.md + sistema de agentes | ✅ Completado |
| **B** | Seguridad: proteger endpoint, validación server-side | 🔜 Siguiente |
| **C** | Testing: unit tests para chart_logic.js y lógica de estado | ⏳ Pendiente |
| **D** | Arquitectura: TypeScript, state management, backend/DB | ⏳ Pendiente |

---

## Sistema de Agentes Especializados

| Agente | Archivo | Cuándo usarlo |
|--------|---------|---------------|
| **auditor** | `.claude/agents/auditor.md` | Antes de un release; revisar seguridad y calidad de código |
| **tester** | `.claude/agents/tester.md` | Generar o correr tests; verificar cobertura |
| **refactor** | `.claude/agents/refactor.md` | Limpiar deuda técnica sin romper comportamiento |
| **architect** | `.claude/agents/architect.md` | Evaluar migraciones o features nuevas complejas |
| **clinico** | `.claude/agents/clinico.md` | **Validar que los tests sean científicamente correctos** |

### Comandos disponibles
- `/audit` — auditoría completa de seguridad y calidad
- `/test` — instalar setup de tests y generar suite mínima
- `/scale [feature]` — evaluar impacto de un cambio antes de implementarlo
- `/validar` — validación clínico-científica de los tests visuales (ISO, ETDRS, ICO)

### Jerarquía de autoridad para cambios en tests visuales

```
1. Normas ISO (ISO 8596:2009, ISO 8597) — máxima autoridad
2. Estudios fundacionales (Bailey & Lovie 1976, Ferris 1982, Sloan 1959)
3. Guías ICO / AOA / AAO
4. Libros de texto clásicos (Borish, Rabbetts, Duke-Elder)
5. Criterio del agente clinico
```

**Cualquier cambio en `chart_logic.js` o `config.js` requiere validación del agente `clinico` antes de hacer commit.**

## Guía para Agentes

### Antes de modificar cualquier archivo
1. Leer el archivo completo primero
2. Verificar que el cambio no rompe la fórmula oftalmológica en `chart_logic.js`
3. Si tocas `config.js`, verificar que `main.js` y `configuracion.js` sigan siendo compatibles
4. No eliminar modos de test sin confirmar con el usuario

### Archivos de solo lectura (no modificar sin revisión médica)
- `chart_logic.js` — fórmulas clínicas validadas (ISO 8596:2009, Ferris et al. 1982)
- `config.js` — optotipos ETDRS/LEA/Lighthouse son estándar oftalmológico internacional

### Archivos seguros para refactorizar
- `style.css` — solo presentación
- `configuracion.js` — no afecta cálculos
- `remote.js` — no afecta pantalla principal

### Tests obligatorios antes de cualquier PR
1. Verificar que `calcularTamanoLogMAR(0.0, defaultConfig)` retorna ~31.91px (6m, 1920px, 52.5cm — optotipo 20/20 subtende 5 arcmin → 0.8727 cm × 36.571 px/cm)
2. Verificar que `convertirLogMarASnellen(0.0)` retorna `"20/20"`
3. Verificar que `convertirLogMarASnellen(1.0)` retorna `"20/200"`
4. Abrir `index.html` y verificar que las 8 flechas de navegación funcionen

---

## Contexto del Equipo

- Proyecto de software médico para optometría clínica
- Usuarios finales: oftalmólogos y optometristas en consulta
- Idioma de UI: español latinoamericano
- Idioma de código: mixto español/inglés (términos médicos en inglés)
