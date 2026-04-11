# LogMAR Pro — Guía de Proyecto para Agentes Claude

## ¿Qué es este proyecto?

**LogMAR Pro** es una aplicación web de optometría clínica para realizar pruebas de agudeza visual digitales en consultorios médicos. Reemplaza las cartillas impresas tradicionales con una pantalla calibrada que calcula matemáticamente el tamaño correcto de los optotipos según la distancia y resolución del monitor.

**Versión actual:** 1.4.0  
**Deploy:** Vercel (build estático + API serverless)  
**Repositorio:** `c:\logmar` / rama principal: `main`

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + TypeScript (ES2020) |
| Bundler | Vite 5 (multi-entry: index, remote, configuracion) |
| Testing | Vitest 2.1.9 — 62 tests |
| Comunicación remoto | PeerJS 1.5.5 (npm) |
| Licencias | Vercel API serverless (`/api/verify-license`) |
| QR codes | api.qrserver.com (CDN externo) |
| Hosting | Vercel |

---

## Estructura de Archivos

```
c:\logmar\
├── index.html              # Pantalla principal de tests (entry point)
├── remote.html             # Interfaz de control remoto (móvil)
├── configuracion.html      # Pantalla de configuración/calibración
├── src/
│   ├── types.ts            # Interfaces TypeScript (ScreenConfig, AppState, etc.)
│   ├── config.ts           # Configuración y cartillas (ETDRS/LEA/Lighthouse/Números)
│   ├── chart_logic.ts      # Motor matemático LogMAR — CRÍTICO
│   ├── state.ts            # AppStore centralizado (pub/sub)
│   ├── main.ts             # Lógica principal — estado, teclado, PeerJS
│   ├── remote.ts           # Lógica del control remoto
│   ├── configuracion.ts    # Gestión de settings y calibración
│   └── license.ts          # Sistema de licencias (server-side)
├── tests/
│   ├── chart_logic.test.ts # 30 tests — fórmulas LogMAR, Snellen, ISO 8596
│   └── config.test.ts      # 32 tests — integridad de cartillas
├── api/
│   └── verify-license.js   # Vercel serverless — validación de licencias
├── style.css               # Estilos principales (~350 líneas, sin duplicados)
├── configuracion.css       # Estilos de configuración
├── tsconfig.json           # TypeScript strict mode
├── vite.config.ts          # Build multi-entry + config de Vitest
├── vercel.json             # Config de deploy + rewrites
├── package.json            # Dependencias Node
└── Optician-Sans.ttf       # Fuente especial para optotipos ETDRS
```

---

## Arquitectura del Sistema

### Flujo de Datos
```
Usuario (teclado/remoto) → Event Listener (src/main.ts)
    → store.setState()     (src/state.ts — AppStore)
    → actualizarPantalla() (suscriptor del store)
    → calcularTamanoLogMAR() (src/chart_logic.ts)
    → DOM manipulation
    → localStorage (persistencia)
```

### Estado Global (src/state.ts — AppStore)
- **`store.state.settings`** — configuración completa (pantalla, cartillas, flags)
- **`store.state.valorLogMarActual`** — valor LogMAR actual mostrado (float)
- **`store.state.indiceModoActual`** — índice del modo de test activo
- **`store.state.randomizedLines`** — letras aleatorizadas por línea LogMAR
- **`store.subscribe(fn)`** — suscribirse a cambios; retorna `unsubscribe`

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

## Fórmulas Matemáticas Críticas (src/chart_logic.ts)

### calcularTamanoLogMAR(valorLogMar, config)
```typescript
// MAR = 10^LogMAR (minutos de arco)
// Ángulo optotipo = 5 × MAR (el optotipo subtiende 5 veces su MAR)
// Tamaño (cm) = Distancia (cm) × tan(5 × MAR en radianes)
// Píxeles = Tamaño (cm) × (resoluciónPx / anchoPantallaCm) × calibrationFactor
```

### convertirLogMarASnellen(valorLogMar)
```typescript
// Denominador Snellen = 20 × 10^LogMAR
// Resultado: "20/X"
```

**Valor canónico:** `calcularTamanoLogMAR(0.0, {6m, 1920px, 52.5cm})` ≈ **31.91 px**

**IMPORTANTE:** Estas fórmulas son clínicamente correctas y validadas. No modificar sin revisión oftalmológica.

---

## Sistema de Licencias

- **Implementación actual:** Vercel serverless (`/api/verify-license.js`) + HMAC-SHA256
- **Variables de entorno en Vercel:** `GOOGLE_SCRIPT_URL`, `LICENSE_SECRET`
- **Flujo:** Cliente envía clave → Vercel verifica firma → responde `{valid: true/false}`
- **Persistencia local:** `localStorage.setItem('logmar_license_active', 'true')`

---

## Problemas Conocidos

No hay problemas críticos activos. Todo el backlog de las Fases A–D está resuelto.

### 🟢 Deuda técnica futura (Fase E — cuando aplique)
1. Sin historial de pacientes ni base de datos
2. Sin soporte multi-clínica / multi-optometrista
3. Sin ARIA/accesibilidad completa
4. Sin error tracking centralizado

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
- **Primer inicio:** si `anchoPantallaCm` es null → redirige a `/configuracion`

### Control de Versiones
- Versionado semántico en `package.json`
- `dist/` en `.gitignore` — Vercel construye desde fuente

---

## Roadmap de Fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| **A** | CLAUDE.md + sistema de agentes | ✅ Completado |
| **B** | Seguridad: endpoint serverless, validación HMAC | ✅ Completado |
| **C** | Testing: 62 tests (chart_logic + config integrity) | ✅ Completado |
| **D** | Arquitectura: TypeScript + Vite + AppStore centralizado | ✅ Completado |
| **E** | Backend + DB: historial de pacientes, multi-clínica | ⏳ Pendiente (no activo) |

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

**Cualquier cambio en `src/chart_logic.ts` o `src/config.ts` requiere validación del agente `clinico` antes de hacer commit.**

---

## Guía para Agentes

### Antes de modificar cualquier archivo
1. Leer el archivo completo primero
2. Verificar que el cambio no rompe la fórmula oftalmológica en `src/chart_logic.ts`
3. Si tocas `src/config.ts`, verificar que `src/main.ts` y `src/configuracion.ts` sigan siendo compatibles
4. No eliminar modos de test sin confirmar con el usuario

### Archivos de solo lectura (no modificar sin revisión médica)
- `src/chart_logic.ts` — fórmulas clínicas validadas (ISO 8596:2009, Ferris et al. 1982)
- `src/config.ts` — optotipos ETDRS/LEA/Lighthouse son estándar oftalmológico internacional

### Archivos seguros para refactorizar
- `style.css` — solo presentación
- `src/configuracion.ts` — no afecta cálculos
- `src/remote.ts` — no afecta pantalla principal

### Tests obligatorios antes de cualquier PR
1. `npm test` — 62/62 deben pasar
2. `npm run typecheck` — 0 errores
3. `npm run build` — build exitoso
4. Verificar que `calcularTamanoLogMAR(0.0, defaultConfig)` retorna ~31.91px (6m, 1920px, 52.5cm)
5. Verificar que `convertirLogMarASnellen(0.0)` retorna `"20/20"`

---

## Contexto del Equipo

- Proyecto de software médico para optometría clínica
- Usuarios finales: oftalmólogos y optometristas en consulta
- Idioma de UI: español latinoamericano
- Idioma de código: mixto español/inglés (términos médicos en inglés)
