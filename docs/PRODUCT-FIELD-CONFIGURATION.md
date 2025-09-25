# Configuración Global de Campos por Tipo de Producto

## Descripción

Sistema profesional y simplificado para configurar la visibilidad de campos específicos en formularios según el tipo de producto principal configurado a nivel de sistema. Permite crear contenedores Docker especializados para diferentes productos.

## Variables de Entorno

### Configuración Principal

- **`PRIMARY_PRODUCT_TYPE`**: Tipo de producto principal del sistema

### Valores Soportados

- `COFFEE`: Base de datos especializada en café
- `CACAO`: Base de datos especializada en cacao
- `SHRIMP`: Base de datos especializada en camarón

## Configuración por Entorno

### 1. Desarrollo Local

Edita `fe/src/assets/env.js`:

```javascript
// Para base de datos de CAFÉ
window['env']['primaryProductType'] = 'COFFEE';

// Para base de datos de CACAO
window['env']['primaryProductType'] = 'CACAO';

// Para base de datos de CAMARÓN
window['env']['primaryProductType'] = 'SHRIMP';
```

### 2. Archivo .env

Copia `.env.example` a `.env` y configura:

```bash
# Para base de datos de café
PRIMARY_PRODUCT_TYPE=COFFEE

# Para base de datos de cacao
PRIMARY_PRODUCT_TYPE=CACAO

# Para base de datos de camarón
PRIMARY_PRODUCT_TYPE=SHRIMP
```

### 3. Docker Compose

En `fe/.ci/develop/docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - PRIMARY_PRODUCT_TYPE=COFFEE  # o CACAO o SHRIMP
```

### 4. Docker Run

```bash
# Contenedor para base de datos de CAFÉ
docker run -e PRIMARY_PRODUCT_TYPE=COFFEE inatrace-fe:latest

# Contenedor para base de datos de CACAO  
docker run -e PRIMARY_PRODUCT_TYPE=CACAO inatrace-fe:latest

# Contenedor para base de datos de CAMARÓN
docker run -e PRIMARY_PRODUCT_TYPE=SHRIMP inatrace-fe:latest
```

## Configuración Actual de Campos

### Base de Datos de CAFÉ (`PRIMARY_PRODUCT_TYPE=COFFEE`)

**Campos Visibles:**
- `numberOfPlants` (Número de Plantas)
- `processingMethod` (Método de Procesamiento)

**Campos Ocultos:**
- `fermentationDays` (Días de Fermentación)
- `dryingMethod` (Método de Secado)

### Base de Datos de CACAO (`PRIMARY_PRODUCT_TYPE=CACAO`)

**Campos Visibles:**
- `fermentationDays` (Días de Fermentación)
- `dryingMethod` (Método de Secado)

**Campos Ocultos:**
- `numberOfPlants` (Número de Plantas)
- `processingMethod` (Método de Procesamiento)

### Base de Datos de CAMARÓN (`PRIMARY_PRODUCT_TYPE=SHRIMP`)

**Campos Visibles:**
- Ningún campo específico (todos los campos agrícolas están ocultos)

**Campos Ocultos:**
- `numberOfPlants` (Número de Plantas)
- `processingMethod` (Método de Procesamiento)
- `fermentationDays` (Días de Fermentación)
- `dryingMethod` (Método de Secado)

## Uso en Componentes

### Importar el Servicio

```typescript
import { ProductFieldVisibilityService } from '../../../shared-services/product-field-visibility.service';

constructor(
  // ... otros servicios
  private fieldVisibilityService: ProductFieldVisibilityService
) { }
```

### Verificar Visibilidad de Campo

```typescript
// Verificar si un campo debe mostrarse para un tipo de producto específico
shouldShowField = this.fieldVisibilityService.shouldShowField('numberOfPlants', productType);

// Verificar si un campo debe mostrarse según configuración del sistema
shouldShowField = this.fieldVisibilityService.shouldShowField('numberOfPlants');
```

### En Templates

```html
<!-- Campo condicional -->
<textinput
  *ngIf="fieldVisibilityService.shouldShowField('numberOfPlants', productType)"
  [form]="form.get('numberOfPlants')"
  label="Número de Plantas">
</textinput>

<!-- Usando método del componente -->
<textinput
  *ngIf="shouldShowFieldForProductType('numberOfPlants', index)"
  [form]="farmPlantInfo.get('numberOfPlants')"
  label="Número de Plantas">
</textinput>
```

## Agregar Nuevos Campos

### 1. Actualizar Configuración del Servicio

Edita `fe/src/app/shared-services/product-field-visibility.service.ts`:

```typescript
private readonly hiddenFieldsByProductType = {
  COFFEE: [
    'fermentationDays',
    'dryingMethod',
    'newFieldForCacao'  // ← Agregar aquí
  ],
  CACAO: [
    'numberOfPlants',
    'processingMethod',
    'newFieldForCoffee'  // ← Agregar aquí
  ]
};
```

### 2. Usar en Componentes

```typescript
shouldShowNewField(): boolean {
  return this.fieldVisibilityService.shouldShowField('newFieldForCacao');
}
```

### 3. Aplicar en Template

```html
<textinput
  *ngIf="fieldVisibilityService.shouldShowField('newFieldForCacao')"
  [form]="form.get('newFieldForCacao')"
  label="Nuevo Campo">
</textinput>
```

## Debug y Troubleshooting

### Verificar Configuración Actual

```typescript
// En cualquier componente con el servicio inyectado
console.log('Debug Info:', this.fieldVisibilityService.getDebugInfo());
```

### Información de Debug

```javascript
{
  systemProductType: "COFFEE",
  hiddenFields: ["fermentationDays", "dryingMethod"],
  allConfiguration: {
    COFFEE: ["fermentationDays", "dryingMethod"],
    CACAO: ["numberOfPlants", "processingMethod"]
  }
}
```

### Verificar Tipo de Sistema

```typescript
// Verificar si el sistema está configurado para un producto específico
const isCoffeeSystem = this.fieldVisibilityService.isSystemConfiguredFor('COFFEE');
const isCacaoSystem = this.fieldVisibilityService.isSystemConfiguredFor('CACAO');

// Obtener campos ocultos para el sistema actual
const hiddenFields = this.fieldVisibilityService.getHiddenFields();
```

## Casos de Uso

### 1. Contenedor Especializado para Café

```bash
# Desplegar contenedor solo para café
docker run -e PRIMARY_PRODUCT_TYPE=COFFEE inatrace-fe:latest
```

- Muestra campos específicos de café (numberOfPlants, processingMethod)
- Oculta campos específicos de cacao (fermentationDays)

### 2. Contenedor Especializado para Cacao

```bash
# Desplegar contenedor solo para cacao
docker run -e PRIMARY_PRODUCT_TYPE=CACAO inatrace-fe:latest
```

- Muestra campos específicos de cacao (fermentationDays, dryingMethod)
- Oculta campos específicos de café (numberOfPlants)

### 3. Contenedor Mixto

```bash
# Desplegar contenedor para múltiples productos
docker run -e PRIMARY_PRODUCT_TYPE=MIXED inatrace-fe:latest
```

- Evalúa cada campo según el tipo de producto específico seleccionado
- Comportamiento dinámico basado en el producto individual

## Extensibilidad

El sistema está diseñado para ser extensible:

1. **Nuevos Tipos de Producto**: Agregar nuevos patrones en `visibleFor`/`hiddenFor`
2. **Nuevos Campos**: Agregar configuración en `fieldVisibilityConfig`
3. **Lógica Compleja**: Extender el método `shouldShowField()` para casos especiales
4. **Configuración Externa**: Posibilidad de cargar configuración desde API

## Beneficios

- **Contenedores Especializados**: Crear imágenes Docker optimizadas por producto
- **UX Mejorada**: Mostrar solo campos relevantes al contexto
- **Mantenimiento Simplificado**: Configuración centralizada
- **Flexibilidad**: Soporte para sistemas mixtos y especializados
