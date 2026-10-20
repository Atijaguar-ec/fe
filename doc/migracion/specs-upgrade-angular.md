# Especificaciones: Upgrade Angular 10 → 19

**Change**: angular-upgrade  
**Tipo**: Delta (no existen specs previas — spec completa)  
**RFC 2119**: MUST = obligatorio, SHOULD = recomendado, MAY = opcional

---

## Dominio: Build & Tooling

### Requirement: Angular Core Upgrade

El sistema MUST compilar con Angular 19 y TypeScript 5.5+ sin errores de build.

#### Scenario: Build de producción exitoso

- GIVEN que todas las dependencias `@angular/*` están en v19.x
- WHEN se ejecuta `ng build --configuration=production`
- THEN el build MUST completarse sin errores
- AND el bundle de salida MUST generarse en `dist/`

#### Scenario: Dev server funcional

- GIVEN que el proyecto compila exitosamente
- WHEN se ejecuta `ng serve --configuration=dev --proxy-config proxy.INATrace-local.conf.json`
- THEN el servidor MUST iniciar sin errores
- AND la app MUST cargarse en el navegador

#### Scenario: angular.json sin opciones deprecadas

- GIVEN que `angular.json` ha sido actualizado
- WHEN se inspecciona la configuración de build
- THEN MUST NOT contener `extractCss`, `vendorChunk`, ni `defaultProject`
- AND MUST usar el builder correcto para Angular 19

---

### Requirement: TypeScript Upgrade

El proyecto MUST compilar con TypeScript ≥ 5.5.

#### Scenario: tsconfig compatible

- GIVEN que `tsconfig.json` y `tsconfig.app.json` están actualizados
- WHEN se ejecuta `npx tsc --noEmit`
- THEN MUST completar sin errores de tipo
- AND los `compilerOptions` MUST incluir `target: ES2022` o superior

---

## Dominio: Linting

### Requirement: Migración TSLint → ESLint

El proyecto MUST usar ESLint + `@angular-eslint` para análisis estático. TSLint MUST NOT estar presente.

#### Scenario: TSLint eliminado

- GIVEN que la migración de linting está completa
- WHEN se inspecciona el proyecto
- THEN `tslint.json` MUST NOT existir
- AND `codelyzer` MUST NOT estar en `devDependencies`
- AND `@angular-devkit/build-angular:tslint` MUST NOT aparecer en `angular.json`

#### Scenario: ESLint funcional

- GIVEN que `.eslintrc.json` existe con reglas `@angular-eslint`
- WHEN se ejecuta `ng lint`
- THEN MUST ejecutarse sin errores de configuración
- AND SHOULD reportar 0 errores (o solo warnings aceptables)

---

## Dominio: E2E Testing

### Requirement: Migración Protractor → Playwright

El proyecto MUST tener tests e2e funcionales con Playwright. Protractor MUST NOT estar presente.

#### Scenario: Protractor eliminado

- GIVEN que la migración e2e está completa
- WHEN se inspecciona el proyecto
- THEN el directorio `e2e/` con `protractor.conf.js` MUST NOT existir
- AND `protractor` MUST NOT estar en `devDependencies`

#### Scenario: Playwright configurado

- GIVEN que Playwright está instalado y configurado
- WHEN se ejecuta `npx playwright test`
- THEN MUST ejecutar al menos los tests de smoke
- AND SHOULD cubrir flujo de login como mínimo

#### Scenario: Flujos críticos

- GIVEN que la app está corriendo contra el backend
- WHEN se ejecutan los tests e2e de Playwright
- THEN los flujos MUST verificar: navegación a login, carga de dashboard, listado de companies
- AND cada test MUST completar en < 30 segundos

---

## Dominio: Dependencias UI

### Requirement: ng-bootstrap actualizado

El sistema MUST usar `@ng-bootstrap/ng-bootstrap` compatible con Angular 19.

#### Scenario: Modales funcionales

- GIVEN que ng-bootstrap está actualizado a v17+
- WHEN un usuario abre un modal (ej: confirmación de acción)
- THEN el modal MUST renderizarse correctamente
- AND MUST cerrarse al hacer click en el botón de cerrar

#### Scenario: Componentes ng-bootstrap

- GIVEN que los componentes ng-bootstrap están actualizados
- WHEN se navega por la app
- THEN dropdowns, tooltips, datepickers y typeaheads MUST funcionar sin errores en consola

---

### Requirement: Charts actualizados

El sistema MUST renderizar gráficos con `ng2-charts` v6 / `chart.js` v4 y `ngx-echarts` v18.

#### Scenario: ng2-charts v6 funcional

- GIVEN que `ng2-charts` está en v6 y `chart.js` en v4
- WHEN se navega a una vista con gráficos (ej: dashboard, analytics)
- THEN los gráficos MUST renderizarse con datos visibles
- AND MUST NOT mostrar errores de API en consola

#### Scenario: ngx-echarts funcional

- GIVEN que `ngx-echarts` está en v18 y `echarts` en v5.4+
- WHEN se carga una vista con ECharts
- THEN los gráficos MUST renderizarse correctamente

---

### Requirement: TinyMCE actualizado

El editor de texto MUST funcionar con `tinymce` v7 y `@tinymce/tinymce-angular` v8.

#### Scenario: Editor rich text funcional

- GIVEN que TinyMCE está actualizado
- WHEN un usuario abre un campo con rich text editor
- THEN el editor MUST cargarse con toolbar visible
- AND MUST permitir formato de texto (negrita, listas, links)
- AND los assets (skins, themes, plugins) MUST cargarse desde `node_modules/tinymce/`

---

## Dominio: API Client

### Requirement: Generador de API compatible

El sistema MUST generar clientes TypeScript/Angular desde la spec OpenAPI del backend. El generador MUST ser compatible con Angular 19.

#### Scenario: Generación exitosa

- GIVEN que el generador OpenAPI está configurado
- WHEN se ejecuta `npm run generate-api`
- THEN MUST generar archivos TypeScript sin errores
- AND los services generados MUST compilar con Angular 19

#### Scenario: Generador alternativo (si aplica)

- GIVEN que `openapi-typescript-angular-generator` NO es compatible con Angular 19
- WHEN se evalúa `openapi-generator-cli` como alternativa
- THEN la alternativa SHOULD generar servicios con la misma interfaz de API
- AND los componentes existentes SHOULD requerir cambios mínimos

---

## Dominio: RxJS

### Requirement: RxJS 7 compatible

El sistema MUST funcionar con RxJS 7.8.x sin imports rotos.

#### Scenario: Imports actualizados

- GIVEN que RxJS está en v7.8
- WHEN se compila el proyecto
- THEN MUST NOT haber errores de import de operadores
- AND los pipes `combineLatest`, `switchMap`, `map` MUST funcionar desde `rxjs` y `rxjs/operators`

---

**Status**: success  
**Summary**: Specs creadas para 6 dominios: Build & Tooling, Linting, E2E Testing, Dependencias UI, API Client, RxJS. 10 requirements con 16 scenarios Given/When/Then.  
**Artifacts**: `inatrace-frontend/doc/migracion/specs-upgrade-angular.md` | Engram `sdd/angular-upgrade/spec`  
**Next**: `sdd-design` o `sdd-tasks`  
**Risks**: Ninguno adicional — riesgos ya documentados en propuesta
