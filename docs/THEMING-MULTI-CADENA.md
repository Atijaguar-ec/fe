# 🎨 Sistema de Theming Dinámico Multi-Cadena

## Descripción General

Sistema profesional de theming reactivo que permite cambiar la apariencia visual de INATrace en tiempo real según la cadena de valor activa (Cocoa, Shrimp, Coffee). Utiliza CSS Custom Properties y RxJS para actualizaciones dinámicas sin necesidad de reconstruir la aplicación.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     APP_INITIALIZER                          │
│                  (theme-initializer.ts)                      │
│                          ↓                                    │
│     Lee PRIMARY_PRODUCT_TYPE del environment                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               ChainThemeService                              │
│          (chain-theme.service.ts)                            │
│                                                               │
│  • BehaviorSubject<ThemePalette>                            │
│  • Métodos: setTheme(), getCurrentTheme()                   │
│  • Backward compatibility con ThemeService legacy           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            Chain Theme Config                                │
│         (chain-theme.config.ts)                              │
│                                                               │
│  cocoa:  { primary: '#4B382A', ... }                        │
│  shrimp: { primary: '#0077BE', ... }                        │
│  coffee: { primary: '#4B382A', ... }                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          CSS Custom Properties                               │
│        (theme-variables.css)                                 │
│                                                               │
│  :root {                                                      │
│    --theme-primary: #4B382A;                                │
│    --theme-secondary: #281F18;                              │
│    ...                                                        │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              UI Components                                   │
│         Consumen las variables CSS                           │
│                                                               │
│  background-color: var(--theme-primary);                    │
│  color: var(--theme-text-primary);                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Archivos del Sistema

### 1. **Configuración de Temas**
```
fe/src/app/shared-services/chain-theme.config.ts
```
- Define las paletas de colores para cada cadena
- Interfaces TypeScript con tipos fuertes
- Funciones helper para validación y conversión

### 2. **Servicio de Theming**
```
fe/src/app/shared-services/chain-theme.service.ts
```
- Servicio Angular con estado reactivo
- BehaviorSubject para emisión de cambios
- Métodos públicos para consumo
- Capa de compatibilidad con ThemeService legacy

### 3. **Inicializador de App**
```
fe/src/app/core/theme-initializer.ts
```
- Factory para APP_INITIALIZER
- Integración con EnvironmentInfoService
- Carga del tema antes del bootstrap

### 4. **Variables CSS**
```
fe/src/styles/theme-variables.css
```
- CSS Custom Properties globales
- Valores por defecto para SSR
- Clases utilitarias de theming
- Soporte para accesibilidad

---

## 🚀 Guía de Uso

### Integración en app.module.ts

```typescript
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { themeInitializerFactory } from './core/theme-initializer';
import { ChainThemeService } from './shared-services/chain-theme.service';
import { EnvironmentInfoService } from './core/environment-info.service';

@NgModule({
  // ... otros imports
  providers: [
    // ... otros providers
    {
      provide: APP_INITIALIZER,
      useFactory: themeInitializerFactory,
      deps: [ChainThemeService, EnvironmentInfoService],
      multi: true
    }
  ]
})
export class AppModule { }
```

### Consumo en Componentes (Opción 1: Reactivo)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChainThemeService } from 'src/app/shared-services/chain-theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-component',
  template: `
    <div [style.background-color]="currentTheme.primary">
      Dynamic themed component
    </div>
  `
})
export class MyComponent implements OnInit, OnDestroy {
  currentTheme: any;
  private themeSubscription: Subscription;

  constructor(private chainTheme: ChainThemeService) {}

  ngOnInit() {
    // Suscribirse a cambios de tema (reactivo)
    this.themeSubscription = this.chainTheme.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('Theme updated:', theme);
    });
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }
}
```

### Consumo en Componentes (Opción 2: CSS Variables)

```typescript
@Component({
  selector: 'app-my-component',
  template: `
    <div class="themed-card">
      <h2 class="theme-text-primary">Título</h2>
      <button class="theme-bg-primary">Acción</button>
    </div>
  `,
  styles: [`
    .themed-card {
      background-color: var(--theme-light);
      border: 1px solid var(--theme-border);
      padding: 1rem;
    }

    .themed-card button {
      background-color: var(--theme-primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }

    .themed-card button:hover {
      opacity: var(--theme-hover-opacity);
    }
  `]
})
export class MyComponent {}
```

### Backward Compatibility (ThemeService Legacy)

```typescript
// Código existente sigue funcionando sin cambios
constructor(public theme: ChainThemeService) {}

// Acceso directo a propiedades (usa getters internos)
const primaryColor = this.theme.primary;
const secondaryColor = this.theme.secondary;
```

---

## 🎨 Paletas de Colores por Cadena

### Cocoa / Coffee (Tonos Tierra)
```typescript
{
  primary: '#4B382A',         // Marrón café/cacao
  secondary: '#281F18',       // Marrón oscuro
  success: '#26AE60',         // Verde
  info: '#1E90FF',           // Azul
  warning: '#FFBB38',        // Amarillo
  danger: '#DF1642'          // Rojo
}
```

### Shrimp (Tonos Acuáticos)
```typescript
{
  primary: '#0077BE',         // Azul océano
  secondary: '#004F7C',       // Azul marino
  tertiary: '#00BFA5',        // Turquesa
  success: '#00BFA5',         // Turquesa (sostenibilidad)
  info: '#0077BE',           // Azul primario
  warning: '#FFA726',        // Naranja
  danger: '#EF5350'          // Coral rojo
}
```

---

## 🛠️ API del ChainThemeService

### Métodos Públicos

#### `initializeTheme(productType?: string): void`
Inicializa el tema basado en el tipo de producto. Llamado automáticamente por APP_INITIALIZER.

```typescript
chainThemeService.initializeTheme('SHRIMP');
```

#### `setTheme(chain: ChainType): void`
Cambia el tema activo manualmente.

```typescript
chainThemeService.setTheme('shrimp');
```

#### `getCurrentTheme(): ThemePalette`
Obtiene el tema actual de forma síncrona.

```typescript
const theme = chainThemeService.getCurrentTheme();
console.log(theme.primary); // '#0077BE' para shrimp
```

#### `getActiveChain(): ChainType`
Obtiene la cadena activa.

```typescript
const chain = chainThemeService.getActiveChain(); // 'shrimp'
```

#### `isChainActive(chain: ChainType): boolean`
Verifica si una cadena específica está activa.

```typescript
if (chainThemeService.isChainActive('shrimp')) {
  console.log('Tema de camarón activo');
}
```

#### `getColor(colorKey: keyof ThemePalette): string`
Obtiene un color específico del tema actual.

```typescript
const primary = chainThemeService.getColor('primary');
```

#### `previewTheme(chain: ChainType): void`
Previsualiza un tema sin persistir el cambio (útil para editores).

```typescript
chainThemeService.previewTheme('coffee');
```

### Observables

#### `currentTheme$: Observable<ThemePalette>`
Observable reactivo del tema actual.

```typescript
this.chainTheme.currentTheme$.subscribe(theme => {
  // Reaccionar a cambios de tema
});
```

---

## 🎯 Casos de Uso

### 1. Desarrollo con Diferentes Cadenas

```bash
# Cocoa (default)
npm run dev:cocoa

# Shrimp (camarón)
npm run dev:shrimp

# Coffee (café)
npm run dev:coffee
```

El tema se carga automáticamente según `PRIMARY_PRODUCT_TYPE`.

### 2. Cambio Manual de Tema (Admin/Testing)

```typescript
import { ChainThemeService } from 'src/app/shared-services/chain-theme.service';

export class ThemeSwitcherComponent {
  constructor(private chainTheme: ChainThemeService) {}

  switchToShrimp() {
    this.chainTheme.setTheme('shrimp');
    // UI se actualiza instantáneamente
  }

  switchToCocoa() {
    this.chainTheme.setTheme('cocoa');
  }
}
```

### 3. Preview de Temas (Editor B2C)

```typescript
previewMode = false;

startPreview(chain: ChainType) {
  this.previewMode = true;
  this.chainTheme.previewTheme(chain);
}

cancelPreview() {
  this.previewMode = false;
  // Restaurar tema original
  this.chainTheme.setTheme(this.originalChain);
}

saveTheme(chain: ChainType) {
  this.chainTheme.setTheme(chain);
  this.previewMode = false;
}
```

---

## 🎨 Clases Utilitarias CSS

El sistema incluye clases utilitarias para uso rápido:

```html
<!-- Fondos -->
<div class="theme-bg-primary">Fondo primario</div>
<div class="theme-bg-secondary">Fondo secundario</div>

<!-- Textos -->
<h1 class="theme-text-primary">Título principal</h1>
<p class="theme-text-secondary">Texto secundario</p>

<!-- Bordes -->
<div class="theme-border-primary">Con borde primario</div>

<!-- Estados semánticos -->
<span class="theme-success">✓ Éxito</span>
<span class="theme-danger">✗ Error</span>
<span class="theme-warning">⚠ Advertencia</span>
<span class="theme-info">ℹ Info</span>
```

---

## 📝 Mejores Prácticas

### 1. Usar CSS Variables en Estilos

✅ **Recomendado:**
```scss
.my-component {
  background-color: var(--theme-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}
```

❌ **Evitar:**
```scss
.my-component {
  background-color: #4B382A; // Hardcoded
}
```

### 2. Suscribirse a Cambios de Tema

✅ **Recomendado:**
```typescript
ngOnInit() {
  this.themeSubscription = this.chainTheme.currentTheme$.subscribe(theme => {
    this.updateUI(theme);
  });
}

ngOnDestroy() {
  this.themeSubscription?.unsubscribe();
}
```

### 3. Usar Transiciones Suaves

Las transiciones están habilitadas globalmente. Para desactivar en elementos específicos:

```scss
.no-transition {
  @extend .no-theme-transition;
}
```

### 4. Validar Contraste (Accesibilidad)

```typescript
// Verificar si el tema actual cumple estándares WCAG
const theme = this.chainTheme.getCurrentTheme();
// Implementar lógica de validación de contraste
```

---

## 🔧 Troubleshooting

### Problema: El tema no se aplica al iniciar

**Solución:**
Verificar que el APP_INITIALIZER esté configurado correctamente en app.module.ts.

```typescript
providers: [
  {
    provide: APP_INITIALIZER,
    useFactory: themeInitializerFactory,
    deps: [ChainThemeService, EnvironmentInfoService],
    multi: true
  }
]
```

### Problema: Los colores no cambian dinámicamente

**Solución:**
Verificar que los estilos usen CSS custom properties en lugar de valores hardcoded.

### Problema: Tema incorrecto en producción

**Solución:**
Verificar que `PRIMARY_PRODUCT_TYPE` esté configurado correctamente en las variables de entorno.

---

## 🔄 Comparación: Antes vs Después

### Antes (Sistema Rígido)

```typescript
// theme.service.ts
export class ThemeService {
  primary = '#4B382A';  // Hardcoded
  secondary = '#281F18'; // Hardcoded
  // No reactivo, sin flexibilidad
}
```

**Problemas:**
- ❌ Colores hardcoded e inmutables
- ❌ Sin soporte multi-cadena
- ❌ Requiere rebuild para cambios
- ❌ No reactivo

### Después (Sistema Dinámico)

```typescript
// chain-theme.service.ts
export class ChainThemeService {
  private _currentTheme$ = new BehaviorSubject<ThemePalette>(...);
  
  setTheme(chain: ChainType) {
    const theme = getChainTheme(chain);
    this._currentTheme$.next(theme);
    this.applyCSSVariables(theme);
  }
}
```

**Ventajas:**
- ✅ Temas configurables por cadena
- ✅ Cambios instantáneos sin rebuild
- ✅ Reactivo con RxJS
- ✅ Type-safe con TypeScript
- ✅ Backward compatible

---

## 🚀 Roadmap Futuro

### Fase 1 (Completada)
- ✅ Configuración de temas por cadena
- ✅ Servicio reactivo de theming
- ✅ CSS custom properties
- ✅ APP_INITIALIZER integration

### Fase 2 (Pendiente)
- [ ] Componente visual de preview de temas
- [ ] Editor de temas en UI admin
- [ ] Persistencia de preferencias de tema
- [ ] Soporte para temas personalizados por empresa

### Fase 3 (Futuro)
- [ ] Dark mode completo
- [ ] Temas accesibles (high contrast)
- [ ] Exportar/importar configuraciones de tema
- [ ] A/B testing de temas

---

## 📚 Recursos Relacionados

- [Traducciones Multi-Cadena](./TRADUCCIONES-MULTI-CADENA.md)
- [Quickstart Multi-Chain](./QUICKSTART-MULTI-CHAIN.md)
- [Arquitectura Multi-Cadena](../docs/tecnico/arquitectura-multi-cadena.md)

---

## 👥 Contacto y Soporte

**Equipo:** INATrace DevOps Team  
**Versión:** 1.0.0  
**Fecha:** 2025-11-10

Para preguntas o mejoras, contactar al equipo de desarrollo.
