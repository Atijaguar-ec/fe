# Exploración: Actualización de versión Angular

**Proyecto**: inatrace-frontend  
**Versión actual**: Angular 10.0.x / TypeScript 3.9 / @angular/cli 10  
**Versión objetivo recomendada**: Angular 19 (latest estable)  
**Fecha exploración**: 2026-03-21  
**Referencia oficial**: https://update.angular.io (10 → 19)

---

## Estado Actual

| Tecnología | Versión Actual | Versión en Angular 19 | Estado |
|---|---|---|---|
| Angular | 10.0.x | 19.x | 🔴 9 versiones de atraso |
| TypeScript | 3.9.x | 5.5+ requerido | 🔴 Migración mayor |
| Node.js requerido | 12.x | 18.19+ / 20+ | 🔴 Actualizar |
| RxJS | 6.5.x | 7.8.x | 🟡 Breaking changes menores |
| @angular/cli | 10.x | 19.x | 🔴 Actualizar |
| Linting | TSLint (deprecado) | ESLint | 🔴 Reemplazar completo |
| E2E Testing | Protractor (deprecado) | Playwright / Cypress | 🔴 Reemplazar completo |
| ng-bootstrap | 6.x | 17.x | 🔴 Breaking changes |
| ng2-charts | 2.x | 6.x | 🔴 Breaking changes |
| TinyMCE Angular | 4.x | 8.x | 🟡 Breaking changes |
| @tinymce/tinymce | 5.x | 7.x | 🟡 API changes |
| ngx-echarts | 6.x | 18.x | 🔴 Breaking changes |
| Mapbox GL | 3.3.0 | compatible | 🟢 OK |
| Bootstrap CSS | 4.5 | opcional | 🟡 Considerar Bootstrap 5 |

---

## Áreas Afectadas

### Core Angular

- `package.json` — Todas las dependencias @angular/* deben actualizarse
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.base.json` — Opciones de compilador cambian
- `angular.json` — Opciones `extractCss` y `vendorChunk` fueron removidas; nueva config de build
- `src/main.ts` — Angular 14+ introduce standalone components; Angular 17+ hace standalone por defecto
- `src/polyfills.ts` — Reducido significativamente desde Angular 13+

### Linting (Crítico)

- `tslint.json` — **TSLint fue deprecado y removido en Angular 12**. Debe migrarse a ESLint + `@angular-eslint`
- `.angular-eslint.json` — Nuevo archivo a crear
- `angular.json` → sección `lint` — Cambiar de `@angular-devkit/build-angular:tslint` a `@angular-eslint/builder:lint`

### Testing E2E (Crítico)

- `e2e/` — Protractor fue deprecado en Angular 12 y removido en Angular 14
- Debe reemplazarse con Playwright (`@playwright/test`) o Cypress

### Módulos y API de Angular

- `app.module.ts` — Si se migra a Standalone API (recomendado desde Angular 17): eliminar NgModule
- `src/app/**/*.module.ts` — Módulos de features pueden mantenerse o migrarse progresivamente
- `HttpClientModule` → `provideHttpClient()` (Angular 15+)
- `RouterModule` → `provideRouter()` (Angular 15+)
- `FormsModule` / `ReactiveFormsModule` → nuevas opciones standalone

### Dependencias de terceros con breaking changes

| Paquete | De | A | Acción |
|---|---|---|---|
| `ng-bootstrap` | 6.x | 17.x | Revisar cambios de API en modales, datepicker, tooltips |
| `ng2-charts` / `chart.js` | 2.x / 2.9 | 6.x / 4.x | API de configuración totalmente reescrita |
| `ngx-echarts` | 6.x | 18.x | Actualizar configuración de módulo |
| `@tinymce/tinymce-angular` | 4.x | 8.x | Revisar API de componente |
| `tinymce` | 5.x | 7.x | Cambios en plugins y configuración |
| `rxjs` | 6.5 | 7.8 | Operadores renombrados; `combineLatest`, `of` sin cambios |
| `@angular/localize` | 10 | 19 | Actualiza con `ng update` automáticamente |
| `angulartics2` | 9.x | verificar | Puede requerir fork o alternativa |

### Generador de API

- `generate-api.js` / `generate-chain-api.js` — Usan `openapi-typescript-angular-generator` via GitHub ref. Esta dependencia puede no ser compatible con Angular 19. Evaluar migración a `openapi-generator-cli`.

---

## Enfoques de Migración

### Opción A — Migración incremental uno-a-uno (Recomendada) 

**Descripción**: Actualizar una versión mayor a la vez siguiendo `ng update`. Angular provee schematics automáticos para la mayoría de los cambios.

```
v10 → v11 → v12 → v13 → v14 → v15 → v16 → v17 → v18 → v19
```

- ✅ Schematics automáticos manejan la mayoría de los cambios de código
- ✅ Más seguro: errores detectados versión por versión
- ✅ Documentación específica por cada salto (`update.angular.io`)
- ❌ Lento: ~9 ciclos de update + fix + test
- **Esfuerzo**: Alto (estimado 3–6 semanas de trabajo)

**Comandos por salto**:
```bash
ng update @angular/core@11 @angular/cli@11
ng update @angular/core@12 @angular/cli@12
# ... repetir hasta 19
```

### Opción B — Migración a versión LTS intermedia luego salto final

**Descripción**: Migrar a Angular 17 LTS (más estable, bien documentado) y luego saltar a 19.

```
v10 → v12 (eliminar TSLint/Protractor) → v17 (LTS, Standalone API) → v19
```

- ✅ Menos ciclos intermedios
- ✅ Angular 17 tiene excelente documentación de migración
- ❌ Saltos más grandes aumentan riesgo de errores acumulados
- **Esfuerzo**: Medio-Alto (estimado 2–4 semanas)

### Opción C — Nueva app Angular 19 + migración de componentes

**Descripción**: Crear un proyecto limpio Angular 19 y migrar componentes/servicios progresivamente.

- ✅ Código limpio desde el inicio; aprovecha Standalone, Signals, etc.
- ✅ Evita deuda técnica acumulada
- ❌ Mayor riesgo de regresiones funcionales
- ❌ Más trabajo: reimplementar la estructura del app
- **Esfuerzo**: Muy Alto (estimado 4–8 semanas)

---

## Recomendación

**Usar Opción A (migración incremental)**, con los siguientes hitos prioritarios:

1. **Hito 1 (v10 → v12)**: Eliminar TSLint → migrar a ESLint. Eliminar Protractor → agregar Playwright.
2. **Hito 2 (v12 → v15)**: Migrar a nuevos providers (`provideRouter`, `provideHttpClient`). Actualizar RxJS 7.
3. **Hito 3 (v15 → v17)**: Evaluar Standalone API. Actualizar ng-bootstrap, ng2-charts, ngx-echarts.
4. **Hito 4 (v17 → v19)**: Actualizar generador OpenAPI. Evaluare Signals API para state management.

**Rama de trabajo sugerida**: `chore/angular-migration` con PRs por hito.

---

## Riesgos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| `openapi-typescript-angular-generator` incompatible con Angular 19 | 🔴 Alto | Evaluar `openapi-generator-cli` como reemplazo |
| `ng2-charts` v2 a v6: API totalmente diferente | 🔴 Alto | Auditar todos los usos de `<canvas baseChart>` antes de migrar |
| `codelyzer` / TSLint: se rompe en Angular 12+ | 🔴 Alto | Migrar a `@angular-eslint` en primer hito |
| `ng-bootstrap` v6 a v17: modales y componentes cambian | 🟡 Medio | Testear manualmente los flujos con modales |
| Tipado más estricto en TypeScript 5.x | 🟡 Medio | Activar `strict: true` gradualmente |
| Tests Karma/Jasmine: karma puede romperse | 🟡 Medio | Migrar tests unitarios a Jest (opcional) |
| `angulartics2` v9: última versión publicada puede no soportar Angular 19 | 🟡 Medio | Evaluar alternativa o fork |
| `hammerjs`: removido de Angular 13 | 🟢 Bajo | Eliminar si no hay gestos de touch complejos |

---

## Listo para Propuesta

**Sí** — La exploración está completa. El orchestrator puede lanzar `sdd-propose` para crear la propuesta formal de cambio con alcance, fases y plan de rollback.

---

## Envelope

**Status**: success  
**Summary**: Exploración completa del upgrade de Angular 10 → 19 para inatrace-frontend. Identificados 9 saltos de versión requeridos, 8 dependencias con breaking changes, 2 herramientas deprecadas (TSLint, Protractor), y 3 opciones de migración con recomendación de migración incremental en 4 hitos.  
**Artifacts**: `inatrace-frontend/doc/migracion/exploracion-upgrade-angular.md` | engram `sdd/explore/angular-upgrade`  
**Next**: `sdd-propose` para formalizar el plan de migración  
**Risks**: openapi-typescript-angular-generator incompatibilidad, ng2-charts API completa reescrita, TSLint/Protractor deprecados
