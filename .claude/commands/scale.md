Evalúa el impacto de escalar o cambiar una parte de LogMAR Pro antes de implementarlo.

## Uso
Describe qué quieres cambiar o agregar como argumento. Por ejemplo:
- `/scale agregar registro de resultados de pacientes`
- `/scale migrar a Vue 3`
- `/scale reemplazar PeerJS con WebSocket propio`
- `/scale agregar soporte multi-clínica`

## Proceso de evaluación (agente architect)

Para la feature/cambio descrito, evalúa:

### 1. Impacto en fórmulas médicas
¿El cambio afecta `chart_logic.js`? Si sí, detalla qué verificación clínica se necesita.

### 2. Impacto en estado actual
¿Cómo interactúa con el objeto `settings`, `localStorage`, o `randomizedLines`?

### 3. Complejidad de implementación
Clasifica como:
- 🟢 **Simple** (1-2 archivos, < 1 día)
- 🟡 **Mediano** (3-5 archivos, 2-5 días, posible refactor previo)
- 🔴 **Complejo** (nueva infraestructura, > 1 semana, decisión arquitectónica)

### 4. Dependencias
¿Qué debe hacerse ANTES de implementar esto?
- ¿Requiere tests previos? (Fase C)
- ¿Requiere seguridad resuelta? (Fase B)
- ¿Requiere backend? (Fase E)

### 5. Plan de implementación
Si la complejidad es 🟢 o 🟡, proporciona:
- Lista de archivos a crear/modificar
- Cambios concretos por archivo
- Verificaciones post-implementación

Si la complejidad es 🔴, proporciona:
- ADR (Architecture Decision Record) usando la plantilla de `architect.md`
- Fases de implementación
- Riesgos y mitigaciones

### 6. Recomendación final
¿Proceder ahora, diferir a una fase posterior, o descartar? ¿Por qué?
