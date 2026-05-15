# Contexto del Microfrontend de Camarón (shrimpMfe)

**Dominio:** Procesamiento Industrial y Trazabilidad de Camarón (DUFER)
**Arquitectura:** Microfrontend Angular (Standalone Components)

## 📌 Reglas Arquitectónicas de UI
Este microfrontend respeta un diseño **"Flow-Driven"**. Las interfaces deben estar ordenadas estrictamente como el flujo físico en planta:
1. Recepción (Generación del Lote Base Único)
2. Clasificación (Entero vs. Cola / Rechazo)
3. Transformación (Bloque, IQF, Valor Agregado, Salmuera)
4. Liquidación (Balance de Masas)

## 🚨 Reglas de Dominio: Trazabilidad y "Masterizado"

Cualquier IA que modifique componentes en `src/app/transformacion/` o `src/app/clasificacion/` DEBE respetar esto:

### 1. El Paradigma de la Presentación Comercial
La regla de oro del negocio dicta DÓNDE el producto toma su "identidad comercial" (Marca + Peso + Caja):
- **Destino Bloque:** Sale de clasificación YA EMPACADO en su cajeta/bloque final. Por lo tanto, el selector de `Presentación Comercial` **VIVE en la pantalla de Clasificación**.
- **Destinos IQF / V.A. / Salmuera:** Salen de clasificación como biomasa a granel en **Gavetas** plásticas. Se procesan y se empacan AL FINAL. Por lo tanto, el selector de `Presentación Comercial` **VIVE en las pantallas de Transformación**.

### 2. Flujo de Rechazo ("Entero" -> "Cola")
- Si se ingresa "Entero" en la Recepción, en la etapa de Clasificación el operador puede generar una **merma justificada**.
- Esta biomasa se envía a "Descabezado Manual", perdiendo peso. 
- Luego regresa a la máquina clasificadora como "Cola".
- **Regla:** El Lote Base JAMÁS CAMBIA. El backend genera sufijos `-COLA`.

### 3. El Paso de "Masterizado" (Transformación)
En las pantallas de Transformación (ej. `bloque.component.ts`), **NO se capturan cajetas sueltas**. 
- La pantalla es estrictamente una estación de "Consolidación de Masters".
- Se capturan: `Masters Producidos`, `Cajetas por Master` (por defecto 10), y `Cajetas Sueltas`.
- El sistema extrapola y calcula matemáticamente el `Peso Total Empacado`.
- De allí se obtiene la `Merma del Área` y el `Rendimiento` de la transformación.

### 4. Acta de Liquidación Final (Excel)
El módulo `liquidacion.component.ts` es responsable de cuadrar todo el Balance de Masas.
- El Excel que genera debe incluir siempre las 4 hojas reglamentarias:
  1. Liquidación Entero (Clasificación origen)
  2. Liquidación Rechazo - Cola (Biomasa recuperada)
  3. Liquidación por Áreas (Libras entrada vs. Masterizado salida)
  4. Balance Consolidado (Lbs Crudas totales vs. Lbs Empacadas totales).

---
**Nota para la IA:** No intentes simplificar los flujos eliminando estos inputs específicos. La complejidad matemática y la diferencia de inputs (Cajetas vs. Gavetas) es intencional y mandataria por el diagrama de procesos industrial de la planta.
