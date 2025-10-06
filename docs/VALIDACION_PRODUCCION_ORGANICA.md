# Validación de Límites de Producción Orgánica

## Descripción

Sistema implementado para validar que la producción orgánica no exceda los límites permitidos según el campo `maxProductionQuantity` del agricultor, evitando así el blanqueo de producto ilegal.

## Componentes Modificados

### 1. `StockUnitListComponent`

**Archivo:** `src/app/company/company-stock/stock-core/stock-unit-list/stock-unit-list.component.ts`

**Cambios:**
- ✅ Agregado `@Input() maxProductionQuantity$: BehaviorSubject<number | null>`
- ✅ Método `validateOrganicProductionLimits()` para validar límites
- ✅ Alertas automáticas cuando se excede el límite

### 2. `CompanyFarmersDetailsComponent`

**Archivo:** `src/app/company/company-farmers/company-farmers-details/company-farmers-details.component.ts`

**Cambios:**
- ✅ Agregado `maxProductionQuantityPing$: BehaviorSubject<number | null>`
- ✅ Método `setupMaxProductionQuantityListener()` para escuchar cambios
- ✅ Listeners en `newFarmer()` y `editFarmer()`

## Uso del Componente

### En Template HTML

```html
<app-stock-unit-list
    [reloadPingList$]="reloadPurchaseOrdersPing$"
    [facilityId$]="facilityIdPing$"
    [companyId]="companyId"
    [representativeOfProducerUserCustomerIdPing$]="representativeOfUserCustomerIdPing$"
    [maxProductionQuantity$]="maxProductionQuantityPing$">
</app-stock-unit-list>
```

### En Componente TypeScript

```typescript
export class MyComponent {
  // BehaviorSubject para pasar el límite de producción
  maxProductionQuantityPing$ = new BehaviorSubject<number | null>(null);

  ngOnInit() {
    // Actualizar el límite cuando cambie el valor del formulario
    this.farmerForm.get('farm.maxProductionQuantity')?.valueChanges.subscribe(value => {
      this.maxProductionQuantityPing$.next(value);
    });
  }
}
```

## Lógica de Validación

### Cálculo de Producción Orgánica

```typescript
const totalOrganicProduction = orders
  .filter(order => order.organic === true)
  .reduce((total, order) => {
    const quantity = order.fulfilledQuantity || order.availableQuantity || 0;
    return total + quantity;
  }, 0);
```

### Alertas Implementadas

#### 1. **Error (Límite Excedido)**
- **Condición:** `totalOrganicProduction > maxQuantity`
- **Mensaje:** "⚠️ ALERTA: Producción orgánica excede el límite permitido por X qq"
- **Duración:** 10 segundos
- **Color:** Rojo (error)

#### 2. **Advertencia (80% del Límite)**
- **Condición:** `totalOrganicProduction > maxQuantity * 0.8`
- **Mensaje:** "⚠️ ADVERTENCIA: Producción orgánica cerca del límite"
- **Duración:** 7 segundos
- **Color:** Amarillo (warning)

## Casos de Uso

### Ejemplo 1: Agricultor con Límite de 100 qq

```typescript
// Configurar límite
maxProductionQuantityPing$.next(100);

// Escenarios:
// - 50 qq orgánicos → Sin alerta
// - 85 qq orgánicos → Advertencia (>80%)
// - 105 qq orgánicos → Error (excede límite)
```

### Ejemplo 2: Detección de Producto Ilegal

```typescript
// Si un agricultor tiene límite de 50 qq pero aparecen 75 qq orgánicos:
// → Alerta: "Producción orgánica excede el límite por 25 qq"
// → Posible indicador de blanqueo de producto ilegal
```

## Beneficios

### 1. **Prevención de Fraude**
- Detecta automáticamente cuando la producción excede límites físicos
- Alerta temprana sobre posible producto ilegal

### 2. **Cumplimiento Regulatorio**
- Ayuda a mantener certificaciones orgánicas
- Facilita auditorías y controles de calidad

### 3. **Transparencia**
- Visibilidad en tiempo real de límites de producción
- Alertas claras y específicas para usuarios

## Configuración por Tipo de Producto

El campo `maxProductionQuantity` respeta la configuración del `ProductFieldVisibilityService`:

- **COFFEE:** ✅ Visible
- **CACAO:** ✅ Visible  
- **SHRIMP:** ❌ Oculto (no aplica para acuicultura)

## Testing

### Casos de Prueba

1. **Límite Normal**
   - Configurar 100 qq
   - Agregar 50 qq orgánicos
   - ✅ Sin alertas

2. **Advertencia**
   - Configurar 100 qq
   - Agregar 85 qq orgánicos
   - ✅ Advertencia amarilla

3. **Error**
   - Configurar 100 qq
   - Agregar 120 qq orgánicos
   - ✅ Error rojo con detalles

4. **Sin Límite**
   - No configurar límite (null)
   - Agregar cualquier cantidad
   - ✅ Sin validación

## Notas Técnicas

- **Unidad:** Quintales (qq)
- **Precisión:** 2 decimales
- **Tipo de Datos:** `number | null`
- **Reactividad:** Tiempo real con BehaviorSubject
- **Performance:** Validación solo cuando cambian los datos
