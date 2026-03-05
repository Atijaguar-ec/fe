# 🎨 Guía de Integración del Sistema de Theming

## Paso a Paso: Integración Completa

### 1. Actualizar app.module.ts

Agregar el APP_INITIALIZER para cargar el tema antes del bootstrap:

```typescript
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Imports del sistema de theming
import { themeInitializerFactory } from './core/theme-initializer';
import { ChainThemeService } from './shared-services/chain-theme.service';
import { EnvironmentInfoService } from './core/environment-info.service';

// Otros imports de la app
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
// ... rest of imports

@NgModule({
  declarations: [
    AppComponent,
    // ... rest of components
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    // ... rest of modules
  ],
  providers: [
    // ... existing providers

    // 🎨 AGREGAR ESTE PROVIDER PARA THEMING DINÁMICO
    {
      provide: APP_INITIALIZER,
      useFactory: themeInitializerFactory,
      deps: [ChainThemeService, EnvironmentInfoService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. Migrar Componentes Existentes

#### Opción A: Sin Cambios (Backward Compatible)

```typescript
// Los componentes existentes siguen funcionando
constructor(public theme: ThemeService) {}

// Acceso directo
const color = this.theme.primary;
```

#### Opción B: Migración a ChainThemeService (Recomendado)

```typescript
// Cambiar import
import { ChainThemeService } from 'src/app/shared-services/chain-theme.service';

// Inyectar servicio
constructor(public theme: ChainThemeService) {}

// Usar igual que antes (getters internos)
const color = this.theme.primary;

// O suscribirse para reactividad
this.theme.currentTheme$.subscribe(theme => {
  console.log('New theme:', theme);
});
```

### 3. Actualizar Estilos a CSS Variables

#### Antes:
```scss
.my-component {
  background-color: #4B382A;
  color: #212121;
}
```

#### Después:
```scss
.my-component {
  background-color: var(--theme-primary);
  color: var(--theme-text-primary);
}
```

### 4. Verificar Funcionamiento

```bash
# Probar con cada cadena
npm run dev:cocoa
npm run dev:shrimp
npm run dev:coffee
```

La UI debería reflejar la paleta de colores correcta para cada cadena.

---

## Migración Gradual (Recomendada)

### Fase 1: Integración Base (1 día)
- ✅ Agregar APP_INITIALIZER
- ✅ Importar theme-variables.css
- ✅ Verificar que funciona con cadena default

### Fase 2: Migración de Componentes Críticos (3-5 días)
- [ ] Identificar componentes que usan ThemeService
- [ ] Migrar a ChainThemeService (opcional, mantiene backward compatibility)
- [ ] Actualizar estilos a CSS variables en componentes principales

### Fase 3: Migración Completa (Opcional, 2 semanas)
- [ ] Refactorizar todos los componentes
- [ ] Eliminar ThemeService legacy
- [ ] Optimizar CSS con variables

---

## Componentes que Requieren Atención

### Alta Prioridad (Usan theme.service.ts)

```typescript
// Buscar componentes con estas inyecciones:
grep -r "public theme: ThemeService" src/app/

// Encontrados (según búsqueda anterior):
- label-selector.component.ts
- label-selector-card.component.ts
- company-farmers-details.component.ts
- company-collectors-details.component.ts
```

### Ejemplo de Migración

**Antes:**
```typescript
import { ThemeService } from 'src/app/shared-services/theme.service';

constructor(public theme: ThemeService) {}
```

**Después (Opción 1 - Mínimo cambio):**
```typescript
import { ChainThemeService as ThemeService } from 'src/app/shared-services/chain-theme.service';

constructor(public theme: ThemeService) {}
// No requiere otros cambios, backward compatible
```

**Después (Opción 2 - Reactivo):**
```typescript
import { ChainThemeService } from 'src/app/shared-services/chain-theme.service';
import { Subscription } from 'rxjs';

export class MyComponent implements OnInit, OnDestroy {
  private themeSubscription: Subscription;
  
  constructor(private chainTheme: ChainThemeService) {}
  
  ngOnInit() {
    this.themeSubscription = this.chainTheme.currentTheme$.subscribe(theme => {
      // Reaccionar a cambios de tema
      this.updateComponentTheme(theme);
    });
  }
  
  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { ChainThemeService } from './chain-theme.service';

describe('ChainThemeService', () => {
  let service: ChainThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChainThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load cocoa theme by default', () => {
    service.initializeTheme('COCOA');
    expect(service.getActiveChain()).toBe('cocoa');
  });

  it('should switch to shrimp theme', () => {
    service.setTheme('shrimp');
    const theme = service.getCurrentTheme();
    expect(theme.primary).toBe('#0077BE');
  });

  it('should emit theme changes', (done) => {
    service.currentTheme$.subscribe(theme => {
      expect(theme).toBeTruthy();
      done();
    });
    service.setTheme('coffee');
  });
});
```

### E2E Tests

```typescript
describe('Dynamic Theming', () => {
  it('should apply shrimp theme colors', () => {
    cy.visit('/');
    cy.get('body').should('have.css', 'background-color', 'rgb(0, 119, 190)'); // #0077BE
  });

  it('should apply transitions on theme change', () => {
    // Implementar test de transiciones
  });
});
```

---

## Checklist de Integración

### Configuración Inicial
- [ ] Agregar APP_INITIALIZER en app.module.ts
- [ ] Importar theme-variables.css en styles.scss
- [ ] Verificar que ChainThemeService se inicializa correctamente

### Migración de Código
- [ ] Identificar componentes que usan ThemeService
- [ ] Decidir estrategia: backward compatible o reescritura reactiva
- [ ] Actualizar imports si es necesario
- [ ] Agregar suscripciones a currentTheme$ donde se requiera reactividad

### Migración de Estilos
- [ ] Identificar hardcoded colors en SCSS
- [ ] Reemplazar con CSS variables
- [ ] Verificar contraste y accesibilidad
- [ ] Probar con todas las cadenas

### Testing
- [ ] Agregar unit tests para ChainThemeService
- [ ] Verificar componentes críticos con cada tema
- [ ] Probar en desarrollo: cocoa, shrimp, coffee
- [ ] Validar build de producción

### Documentación
- [ ] Actualizar README del proyecto
- [ ] Documentar nuevas paletas de colores
- [ ] Crear guía para diseñadores
- [ ] Agregar ejemplos en Storybook (si aplica)

---

## Troubleshooting Común

### Error: "Cannot find module './chain-theme.service'"

**Solución:**
Verificar que los archivos estén en las rutas correctas:
- `src/app/shared-services/chain-theme.config.ts`
- `src/app/shared-services/chain-theme.service.ts`
- `src/app/core/theme-initializer.ts`

### Error: "CSS variables no funcionan en IE11"

**Solución:**
IE11 no soporta CSS variables nativamente. Considerar:
1. Polyfill: [css-vars-ponyfill](https://github.com/jhildenbiddle/css-vars-ponyfill)
2. O mantener soporte limitado sin theming dinámico en IE11

### Warning: "APP_INITIALIZER takes too long"

**Solución:**
El theming debería ser casi instantáneo. Si hay delays:
1. Verificar que no haya llamadas HTTP innecesarias
2. Simplificar la lógica de inicialización
3. Usar lazy loading si el tema no es crítico para el bootstrap

### Los colores no cambian al cambiar PRIMARY_PRODUCT_TYPE

**Solución:**
1. Verificar que APP_INITIALIZER esté ejecutándose
2. Revisar console logs: "🎨 Theme Initializer: Loading theme for..."
3. Confirmar que PRIMARY_PRODUCT_TYPE esté en window.env
4. Verificar que los estilos usen CSS variables, no valores hardcoded

---

## Performance

### Métricas Esperadas

- **Tiempo de inicialización:** < 50ms
- **Tiempo de cambio de tema:** < 100ms
- **Impacto en bundle size:** +5KB (gzip)
- **CSS custom properties:** ~40 variables

### Optimizaciones

1. **Lazy load theme config** si no se usa inmediatamente
2. **Memoizar cálculos** de CSS variables
3. **Debounce** cambios rápidos de tema
4. **Tree-shake** temas no utilizados en producción

---

## Soporte

Para preguntas o issues:
1. Revisar documentación completa: `docs/THEMING-MULTI-CADENA.md`
2. Verificar ejemplos en: `docs/THEMING-INTEGRATION-GUIDE.md`
3. Contactar al equipo de DevOps INATrace

**Versión:** 1.0.0  
**Última actualización:** 2025-11-10
