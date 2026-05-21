# Agent Context — `bloque.component.ts`
> Lea este archivo ANTES de modificar cualquier archivo en este directorio.  
> Documentación de dominio extendida: `dufer-camaron/revision/domain-bloque-masterizado.md`

---

## ¿Qué hace este componente?

Pantalla de **Masterizado de Bloques**: el operario toma cajetas (estuches congelados) que llegaron de la clasificación con destino `BLOQUE`, elige el formato de empaque y registra cuántos cartones master se produjeron.

---

## ⚠️ Regla crítica: Formato `NxM`

```
10 x 5
│     └── M = libras por estuche  →  5 lbs
└──────── N = estuches por master →  10 estuches
          pesoPerMaster = N × M   →  50 lbs
```

**El número de masters depende solo de N (primer número).**  
Cambiar entre `10X4`, `10X5`, `10X2` NO cambia el número de masters ni sobrantes porque todos tienen N=10. Solo cambia el peso.

### `parseFormats()` — función local (línea ~70)
```typescript
// ✅ CORRECTO: match[1] = N (estuches), match[2] = M (lbs/estuche)
const match = label.match(/^(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
cajetasPorMaster = N
lbsPorEstuche    = M
pesoPerMaster    = N × M   // peso COMERCIAL del cartón terminado
```

### `recalcular()` — método (línea ~263)
```typescript
// ✅ CORRECTO: usa peso COMERCIAL del formato, NO el peso crudo de materia prima
this.pesoTotalMasters = mastersCalculados * selectedFormat.pesoPerMaster;
this.pesoSobrantes    = cajetasSobrantes  * selectedFormat.lbsPorEstuche;

// ❌ INCORRECTO (no volver a esto):
// this.pesoTotalMasters = mastersCalculados * cajPorMaster * pesoPerCajeta;
// → Esto usaba el peso crudo de camarón (~17 lbs/caj) en vez del peso del bloque (5 lbs)
// → Generaba valores absurdos: 529 lbs en vez de 150 lbs para 3 masters 10x5
```

El `pesoPerCajeta` (calculado como `item.libras / item.cantidad`) representa materia prima cruda.  
La diferencia entre peso crudo y peso comercial = **merma del área** (normal en procesamiento de camarón).

---

## Lookup de marca → formatos (método `selectItem()`, línea ~216)

```typescript
// ✅ CORRECTO: usar brandName puro primero
const rawBrand = state.item.brandName                         // prioridad 1
  || (state.item.presentationName?.split(' ')[0] ?? '');      // fallback legacy (primera palabra)
const brandPresentations = this.allPresentations.filter(
  p => p.brandName.toLowerCase() === rawBrand.toLowerCase()
);

// ❌ NUNCA hacer esto:
// p.brandName === state.item.presentationName
// "DUFER" !== "DUFER Caja 4 lbs"  → siempre false → "No hay formatos"
```

**Por qué existen dos campos:**
- `TransformWorkItem.brandName` → marca pura: `"DUFER"` ← usar para filtrar
- `TransformWorkItem.presentationName` → display legacy: `"DUFER Caja 4 lbs"` ← solo mostrar en UI

---

## Interfaces locales

### `FormatOption`
```typescript
interface FormatOption {
  label: string;             // "10×5"
  cajetasPorMaster: number;  // N = 10 (estuches por cartón master)
  lbsPorEstuche: number;     // M = 5  (libras por estuche/inner box)
  pesoPerMaster: number;     // N × M = 50 lbs (peso total del cartón master)
}
```

### `WorkItemState`
```typescript
interface WorkItemState {
  item: TransformWorkItem;     // Sub-lote con talla, clase, marca, cajetas
  cajetasRestantes: number;    // Cuántas cajetas quedan por procesar (soporta parcial)
  librasRestantes: number;     // Lbs de materia prima cruda restantes
  pesoPerCajeta: number;       // item.libras / item.cantidad — peso CRUDO por cajeta
}                              // ⚠️ No usar pesoPerCajeta para calcular peso de masters
```

### `BloqueCreado` (master registrado)
```typescript
interface BloqueCreado {
  lote: string;
  talla: string;             // displayName del ShrimpSize
  qualityClass: 'A'|'B'|'C';
  brandName: string;         // Marca pura
  formato: string;           // "10×5"
  mastersCount: number;
  cajetasUsadas: number;     // N × mastersCount
  librasTotal: number;       // mastersCount × pesoPerMaster (peso comercial)
  isMultiLote: boolean;      // true si viene de canasta mezclando lotes
}
```

---

## Cajetas Pendientes (`leftoverBasket`)

- **Qué es:** cajetas que no alcanzaron para completar 1 master (ej. 34 caj con N=10 → 4 sobrantes)
- **Regla de mezcla:** solo `Marca + Talla + Clase` idénticos. No se mezcla A con B, ni marcas distintas
- **Agrupación:** `leftoverGroups` usa clave `"${brandName}|${talla}|${qualityClass}"`
- **Persistencia:** `localStorage` — temporal hasta migrar a tabla backend
- **Los sobrantes NO son rechazo.** Rechazo total = Clase C. Los sobrantes son reclasificables

```typescript
// Clave de agrupación (rebuildLeftoverGroups)
const key = `${entry.brandName}|${entry.talla}|${entry.qualityClass}`;
```

---

## Flujo de datos completo

```
ShrimpMsService.listPendingSubLots('BLOQUE')
    → workItems: TransformWorkItem[]
    → workStates: Map<subLotId, WorkItemState>  (con pesoPerCajeta calculado)
    
Operario clicks sub-lote → selectItem(state)
    → Busca presentations por brandName
    → parseFormats(pres.presentationFormat, pres.weightPerUnit)
    → availableFormats: FormatOption[]

Operario selecciona formato → onFormatSelected(fmt)
    → recalcular()
    → mastersCalculados = floor(cajetas / N)
    → pesoTotalMasters  = masters × pesoPerMaster   ← peso COMERCIAL
    → cajetasSobrantes  = cajetas % N
    → pesoSobrantes     = sobrantes × lbsPorEstuche

Operario hace click en "Registrar Masters"
    → bloquesCreados.push(BloqueCreado)
    → Si sobrantes > 0: leftoverBasket.push(LeftoverEntry)
    → state.cajetasRestantes -= (cajetasConsumidas + sobrantes)
```

---

## Reglas de negocio confirmadas

| Regla | Detalle |
|---|---|
| Formato NxM en UI | N = estuches/master, M = lbs/estuche |
| Peso de masters | `mastersCalculados × pesoPerMaster` (comercial, NO crudo) |
| Peso sobrantes | `cajetasSobrantes × lbsPorEstuche` (comercial) |
| Mezcla de pendientes | Solo Marca + Talla + Clase idénticos |
| Parcial | Operario puede procesar menos cajetas del lote (campo editable) |
| Auto-select | Si solo hay 1 formato disponible, se selecciona automáticamente |
| Filtro de marca | Usar `item.brandName`, nunca `item.presentationName` |

---

## Archivos relacionados

| Archivo | Rol |
|---|---|
| `bloque.component.html` | Template HTML con grid de formatos, cálculos, canasta |
| `../shared/transform.styles.css` | CSS compartido (`.format-btn`, `.calc-result`, `.leftover-*`) |
| `../../services/shrimp-ms.service.ts` | Interfaces `TransformWorkItem`, `CommercialPresentation` |
| `../../clasificacion/clasificacion.component.ts` | Produce los `TransformWorkItem` con `brandName` y `presentationName` |
| `../../presentations-config/presentations-config.component.ts` | CRUD de `CommercialPresentation` con formatos NxM |

---

## Anti-regression

- [ ] `pesoTotalMasters = mastersCalculados × selectedFormat.pesoPerMaster` (NO × pesoPerCajeta)
- [ ] `pesoSobrantes = cajetasSobrantes × selectedFormat.lbsPorEstuche` (NO × pesoPerCajeta)
- [ ] Lookup de marca: `item.brandName` puro, no `item.presentationName`
- [ ] `parseFormats`: match[1] = N (estuches), match[2] = M (lbs). pesoPerMaster = N × M
- [ ] Cajetas Pendientes: clave `brandName|talla|qualityClass` — no mezclar clases
- [ ] `lbsPorEstuche` debe existir en `FormatOption` (se agregó 2026-05-21)
- [ ] UI: usar "cajetas" consistentemente (término del operario). "Estuches" solo en documentación técnica
- [ ] Balance de área: lbs recibidas = materia prima CRUDA; lbs en masters = peso COMERCIAL. No son comparables directamente
- [ ] `ProductiveDestination.presentation` solo guarda `presentationName` (string legacy). `brandName` NO se persiste en esa tabla aún
