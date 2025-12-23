# 🔧 Configuración Dinámica de Campos por Cadena

## Objetivo

Controlar la **visibilidad y obligatoriedad** de campos según el tipo de producto (COCOA, SHRIMP, COFFEE) sin modificar código en cada componente.

---

## 🎯 Problema Resuelto

### Antes (❌ Hardcodeado)
```typescript
// Cada componente tenía su propia lógica
if (this.productType === 'SHRIMP') {
  // Ocultar campos de precio
  this.showPrice = false;
} else {
  this.showPrice = true;
}
```

**Problemas:**
- Lógica duplicada en 50+ componentes
- Difícil de mantener
- Cada cambio requiere modificar múltiples archivos

### Después (✅ Centralizado)
```typescript
// Un solo servicio con configuración centralizada
showPriceFields$ = this.fieldConfig.isFieldVisible$('customerOrder', 'currencyForEndCustomer');
```

**Ventajas:**
- Configuración en 1 solo archivo
- Cambios se aplican automáticamente a todos los componentes
- Fácil agregar nuevas cadenas

---

## 📁 Archivos

### 1. Servicio de Configuración
**Ubicación:** `fe/src/app/shared-services/chain-field-config.service.ts`

Define qué campos son visibles/obligatorios para cada cadena:

```typescript
const CHAIN_CONFIGURATIONS = {
  'SHRIMP': {
    customerOrder: {
      currencyForEndCustomer: { visible: false, required: false },  // 🦐 No maneja precio
      pricePerUnitForEndCustomer: { visible: false, required: false }
    },
    stockOrder: {
      moisturePercentage: { visible: true, required: true },  // 🦐 Usa humedad
      pricePerUnit: { visible: false, required: false }
    }
  },
  'COCOA': {
    customerOrder: {
      currencyForEndCustomer: { visible: true, required: true },  // 🍫 Maneja precio
      pricePerUnitForEndCustomer: { visible: true, required: true }
    },
    stockOrder: {
      moisturePercentage: { visible: false, required: false },
      pricePerUnit: { visible: true, required: true }
    }
  }
};
```

---

## 🚀 Cómo Usar

### Paso 1: Inyectar el Servicio

```typescript
import { ChainFieldConfigService } from '../shared-services/chain-field-config.service';

export class MyComponent {
  showPriceFields$: Observable<boolean>;
  
  constructor(public fieldConfig: ChainFieldConfigService) {
    // Observable reactivo para visibilidad
    this.showPriceFields$ = this.fieldConfig.isFieldVisible$('customerOrder', 'currencyForEndCustomer');
  }
}
```

### Paso 2: Usar en el Template

```html
<!-- Ocultar sección completa -->
<div *ngIf="showPriceFields$ | async">
  <input formControlName="currency" />
  <input formControlName="price" />
</div>
```

### Paso 3: Ajustar Validaciones Dinámicamente

```typescript
private applyFieldConfiguration(form: FormGroup): void {
  const priceConfig = this.fieldConfig.getFieldConfig('customerOrder', 'pricePerUnitForEndCustomer');
  
  // Si no es obligatorio, quitar validadores
  if (!priceConfig.required) {
    form.get('pricePerUnitForEndCustomer').clearValidators();
  }
  
  form.get('pricePerUnitForEndCustomer').updateValueAndValidity();
}
```

---

## 📋 Ejemplo Completo: Customer Order

### Component TypeScript

```typescript
export class CustomerOrderItemComponent {
  showPriceFields$: Observable<boolean>;
  
  constructor(
    public fieldConfig: ChainFieldConfigService
  ) {
    this.showPriceFields$ = this.fieldConfig.isFieldVisible$('customerOrder', 'currencyForEndCustomer');
  }
  
  public generateForm(value: any): FormGroup {
    const form = generateFormFromMetadata(ApiStockOrder.formMetadata(), value, ApiStockOrderValidationScheme);
    
    // 🎯 Aplicar configuración dinámica
    this.applyFieldConfiguration(form);
    
    return form;
  }
  
  private applyFieldConfiguration(form: FormGroup): void {
    const currencyConfig = this.fieldConfig.getFieldConfig('customerOrder', 'currencyForEndCustomer');
    const priceConfig = this.fieldConfig.getFieldConfig('customerOrder', 'pricePerUnitForEndCustomer');
    
    if (!currencyConfig.required) {
      form.get('currencyForEndCustomer').clearValidators();
    }
    
    if (!priceConfig.required) {
      form.get('pricePerUnitForEndCustomer').clearValidators();
    }
    
    form.get('currencyForEndCustomer').updateValueAndValidity();
    form.get('pricePerUnitForEndCustomer').updateValueAndValidity();
  }
}
```

### Component HTML

```html
<!-- 🎯 Campos de precio: Ocultos para SHRIMP -->
<div class="af-row" *ngIf="showPriceFields$ | async">
  <div class="af-c12">
    <single-choice
      label="Currency for end-customer"
      [formControlInput]="form.get('currencyForEndCustomer')"
      [codebookService]="currencyCodesService">
    </single-choice>
  </div>
</div>

<div class="af-row" *ngIf="showPriceFields$ | async">
  <div class="af-c12">
    <textinput
      [form]="form.get('pricePerUnitForEndCustomer')"
      label="Price per unit"
      type="number">
    </textinput>
  </div>
</div>
```

---

## 🔧 API del Servicio

### Métodos Principales

#### `isFieldVisible$(module, fieldName): Observable<boolean>`
Observable reactivo para visibilidad de un campo.

```typescript
this.showMoisture$ = this.fieldConfig.isFieldVisible$('stockOrder', 'moisturePercentage');
```

#### `isFieldRequired$(module, fieldName): Observable<boolean>`
Observable reactivo para obligatoriedad de un campo.

```typescript
this.isMoistureRequired$ = this.fieldConfig.isFieldRequired$('stockOrder', 'moisturePercentage');
```

#### `getFieldConfig(module, fieldName): FieldConfig`
Obtiene configuración completa de un campo (síncrono).

```typescript
const config = this.fieldConfig.getFieldConfig('customerOrder', 'pricePerUnitForEndCustomer');
// { visible: false, required: false }
```

#### `isFieldVisible(module, fieldName): boolean`
Verifica visibilidad de un campo (síncrono).

```typescript
if (this.fieldConfig.isFieldVisible('customerOrder', 'currencyForEndCustomer')) {
  // Mostrar campo
}
```

---

## 📊 Configuraciones por Cadena

### SHRIMP 🦐
| Campo | Módulo | Visible | Obligatorio | Razón |
|-------|--------|---------|-------------|-------|
| `currencyForEndCustomer` | customerOrder | ❌ | ❌ | No maneja precios |
| `pricePerUnitForEndCustomer` | customerOrder | ❌ | ❌ | No maneja precios |
| `moisturePercentage` | stockOrder | ✅ | ✅ | Usa humedad |
| `pricePerUnit` | stockOrder | ❌ | ❌ | No maneja precios |

### COCOA 🍫
| Campo | Módulo | Visible | Obligatorio | Razón |
|-------|--------|---------|-------------|-------|
| `currencyForEndCustomer` | customerOrder | ✅ | ✅ | Maneja precios |
| `pricePerUnitForEndCustomer` | customerOrder | ✅ | ✅ | Maneja precios |
| `moisturePercentage` | stockOrder | ❌ | ❌ | No usa humedad |
| `pricePerUnit` | stockOrder | ✅ | ✅ | Maneja precios |

### COFFEE ☕
| Campo | Módulo | Visible | Obligatorio | Razón |
|-------|--------|---------|-------------|-------|
| `currencyForEndCustomer` | customerOrder | ✅ | ✅ | Maneja precios |
| `pricePerUnitForEndCustomer` | customerOrder | ✅ | ✅ | Maneja precios |
| `moisturePercentage` | stockOrder | ✅ | ❌ | Puede usar humedad |
| `pricePerUnit` | stockOrder | ✅ | ✅ | Maneja precios |

---

## 🔄 Agregar Nueva Cadena

Para agregar una nueva cadena (ej: VANILLA):

1. Edita `chain-field-config.service.ts`:

```typescript
const CHAIN_CONFIGURATIONS = {
  // ... otras cadenas
  'VANILLA': {
    customerOrder: {
      currencyForEndCustomer: { visible: true, required: true },
      pricePerUnitForEndCustomer: { visible: true, required: true }
    },
    stockOrder: {
      moisturePercentage: { visible: false, required: false },
      pricePerUnit: { visible: true, required: false }
    },
    payment: {
      bankTransferEvidence: { visible: true, required: false }
    }
  }
};
```

2. **Listo.** Todos los componentes que usan `ChainFieldConfigService` automáticamente aplicarán la nueva configuración.

---

## ✅ Componentes Migrados

- ✅ `customer-order-item.component` (campos de precio ocultos para SHRIMP)

## 📝 Componentes Pendientes

- ⏳ `stock-purchase-orders-modal` (campos de humedad para SHRIMP)
- ⏳ `payment-form` (campos específicos por cadena)
- ⏳ `farmer-form` (campos de certificación orgánica)

---

## 🧪 Testing

```typescript
describe('CustomerOrderItemComponent con SHRIMP', () => {
  beforeEach(() => {
    // Mock del servicio
    const mockFieldConfig = {
      isFieldVisible$: () => of(false),  // Ocultar precios para SHRIMP
      getFieldConfig: () => ({ visible: false, required: false })
    };
    
    TestBed.configureTestingModule({
      providers: [
        { provide: ChainFieldConfigService, useValue: mockFieldConfig }
      ]
    });
  });
  
  it('no debe mostrar campos de precio para SHRIMP', () => {
    component.showPriceFields$.subscribe(visible => {
      expect(visible).toBe(false);
    });
  });
});
```

---

## 🎯 Próximos Pasos

1. **Migrar más componentes**: Aplicar este patrón a otros formularios
2. **Backend API**: Crear endpoint para obtener configuración desde servidor
3. **Configuración en JSON**: Mover configuración a archivos externos
4. **Cache**: Optimizar carga de configuración

---

## 📚 Relacionado

- `docs/TRADUCCIONES-MULTI-CADENA.md` - Sistema de traducciones dinámicas
- `docs/THEMING-MULTI-CADENA.md` - Sistema de temas dinámicos
- `docs/plan-implementacion-multi-cadena.md` - Plan maestro de arquitectura
