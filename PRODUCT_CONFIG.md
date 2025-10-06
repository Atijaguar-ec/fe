# 📦 Product Type Configuration Guide

## Overview
This application supports multi-product configurations (COFFEE, COCOA, SHRIMP) with dynamic field visibility and validation based on the selected product type.

## Configuration Hierarchy

### 1. Environment Variables (Highest Priority)
- **GitHub Actions**: `.github/workflows/deploy-frontend.yml`
  - Manual dispatch input: `product_type` (default: `COCOA`)
  - Environment variable: `PRIMARY_PRODUCT_TYPE`
  
- **Runtime Configuration**: `src/assets/env.js` / `env.template.js`
  - `window.env.PRIMARY_PRODUCT_TYPE` (single source of truth)

### 2. Service Layer
- **EnvironmentInfoService** (`src/app/core/environment-info.service.ts`)
  - Normalizes product types to lowercase: `COCOA` → `cocoa`, `COFFEE` → `coffee`, `SHRIMP` → `shrimp`
  - Provides: `getProductBadgeLabel()`, `getProductDisplayName()`, `isProductType()`
  
- **ProductFieldVisibilityService** (`src/app/shared-services/product-field-visibility.service.ts`)
  - Controls field visibility per product type
  - Method: `shouldShowField(fieldName, productType?)`

## Product-Specific Field Configuration

### COFFEE
**Hidden Fields:**
- `weekNumber`
- `fermentationDays`
- `dryingMethod`

### COCOA
**Hidden Fields:**
- `numberOfPlants`
- `processingMethod`

**Required Fields:**
- `weekNumber` (1-53, validated in purchase orders)

### SHRIMP
**Hidden Fields:**
- `weekNumber`
- `numberOfPlants`
- `processingMethod`
- `fermentationDays`
- `dryingMethod`
- `maxProductionQuantity`

## Implementation Examples

### 1. Component Usage (TypeScript)
```typescript
import { EnvironmentInfoService } from '@app/core/environment-info.service';
import { ProductFieldVisibilityService } from '@app/shared-services/product-field-visibility.service';

constructor(
  private envInfo: EnvironmentInfoService,
  private fieldVisibility: ProductFieldVisibilityService
) {}

// Check product type
isCocoa(): boolean {
  return this.envInfo.isProductType('cocoa');
}

// Control field visibility
shouldShowWeekNumber(): boolean {
  return this.fieldVisibility.shouldShowField('weekNumber');
}
```

### 2. Template Usage (HTML)
```html
<!-- Show field only for COCOA -->
<div *ngIf="envInfo.isProductType('cocoa')">
  <textinput [form]="form.get('weekNumber')" label="N° de Semana"></textinput>
</div>

<!-- Dynamic visibility using service -->
<div *ngIf="fieldVisibility.shouldShowField('fermentationDays')">
  <textinput [form]="form.get('fermentationDays')" label="Días de Fermentación"></textinput>
</div>
```

### 3. Dynamic Validation
```typescript
private updateWeekNumberValidation(): void {
  const ctrl = this.form.get('weekNumber');
  if (this.envInfo.isProductType('cocoa')) {
    ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(53)]);
  } else {
    ctrl.clearValidators();
  }
  ctrl.updateValueAndValidity();
}
```

## Deployment Configuration

### GitHub Actions Workflow
```yaml
workflow_dispatch:
  inputs:
    product_type:
      description: 'Product type configuration'
      required: false
      default: 'COCOA'
      type: choice
      options:
        - COFFEE
        - COCOA
        - SHRIMP

env:
  PRIMARY_PRODUCT_TYPE: ${{ github.event.inputs.product_type || 'COCOA' }}
```

### Local Development
Edit `src/assets/env.development.js`:
```javascript
window['env']['PRIMARY_PRODUCT_TYPE'] = 'COCOA'; // Change to COFFEE or SHRIMP
window['env']['primaryProductType'] = 'COCOA';   // Legacy support
```

## Best Practices

1. **Always use normalized names**: Use `COCOA` (not `CACAO`) in configuration files
2. **Centralize logic**: Use `EnvironmentInfoService` and `ProductFieldVisibilityService` instead of inline checks
3. **Type safety**: Leverage TypeScript types (`'coffee' | 'cocoa' | 'shrimp'`)
4. **Validation**: Apply product-specific validators dynamically in `ngOnInit` or when product changes
5. **Testing**: Verify field visibility and validation for each product type

## Troubleshooting

### Fields not showing/hiding correctly
1. Check `window.env` in browser console
2. Verify `ProductFieldVisibilityService.getDebugInfo()` output
3. Ensure component injects services correctly

### Badge showing wrong product
1. Confirm `PRIMARY_PRODUCT_TYPE` in `env.js`
2. Check `EnvironmentInfoService.getProductBadgeLabel()` output
3. Verify normalization in `normalizeProductType()`

## Migration Notes

- **Old**: `CACAO` → **New**: `COCOA` (standardized)
- Services now handle both `CACAO` and `COCOA` for backward compatibility
- Legacy `primaryProductType` still supported alongside `PRIMARY_PRODUCT_TYPE`
