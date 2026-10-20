# Tasks: Upgrade Angular 10 → 19

**Change**: angular-upgrade  
**Rama**: `chore/angular-migration`

---

## Hito 1: v10 → v12 — Foundation (ESLint, Playwright, cleanup)

- [ ] 1.1 Crear rama `chore/angular-migration` desde `main`
- [ ] 1.2 Verificar Node.js ≥ 14.15 instalado (requisito Angular 12)
- [ ] 1.3 `ng update @angular/core@11 @angular/cli@11` — fix errores de compilación
- [ ] 1.4 Remover opción `extractCss` de `angular.json` (deprecada en v11)
- [ ] 1.5 `ng update @angular/core@12 @angular/cli@12` — fix errores de compilación
- [ ] 1.6 Actualizar TypeScript a 4.3 según requiera Angular 12
- [ ] 1.7 Instalar `@angular-eslint/schematics` y ejecutar `ng g @angular-eslint/schematics:convert-tslint-to-eslint`
- [ ] 1.8 Eliminar `tslint.json` y `codelyzer` de `devDependencies`
- [ ] 1.9 Actualizar `angular.json` sección `lint`: reemplazar builder `tslint` por `@angular-eslint/builder:lint`
- [ ] 1.10 Ejecutar `ng lint` — corregir errores hasta 0 errores
- [ ] 1.11 Desinstalar `protractor` de `devDependencies`, eliminar `e2e/protractor.conf.js` y `e2e/tsconfig.json`
- [ ] 1.12 Instalar `@playwright/test`, crear `playwright.config.ts`
- [ ] 1.13 Escribir test e2e smoke: login page carga correctamente
- [ ] 1.14 Remover `HammerModule`, `HAMMER_GESTURE_CONFIG`, `HammerConfig` e import `hammerjs` de `app.module.ts`
- [ ] 1.15 Desinstalar `hammerjs` de `dependencies`
- [ ] 1.16 Ejecutar `ng build --configuration=production` — verificar build exitoso
- [ ] 1.17 Ejecutar `ng test --watch=false` — verificar tests unitarios pasan
- [ ] 1.18 Commit + tag `milestone-h1`

---

## Hito 2: v12 → v15 — Core upgrade (RxJS 7, providers)

- [ ] 2.1 Verificar Node.js ≥ 14.20 (requisito Angular 14) o ≥ 18.13 (Angular 15)
- [ ] 2.2 `ng update @angular/core@13 @angular/cli@13` — fix errores
- [ ] 2.3 Actualizar `src/polyfills.ts` — remover polyfills innecesarios en v13
- [ ] 2.4 `ng update @angular/core@14 @angular/cli@14` — fix errores
- [ ] 2.5 `ng update @angular/core@15 @angular/cli@15` — fix errores
- [ ] 2.6 Actualizar TypeScript a 4.9 según requiera Angular 15
- [ ] 2.7 `npm install rxjs@7` — instalar RxJS 7 (bridge de compat se removió en v13)
- [ ] 2.8 Buscar y corregir imports rotos de RxJS en `src/app/**/*.ts`
- [ ] 2.9 Actualizar `tsconfig.base.json`: `target: "ES2022"`, ajustar `useDefineForClassFields`
- [ ] 2.10 Verificar `token.interceptor.ts` y `language.interceptor.ts` compilan sin errores
- [ ] 2.11 Ejecutar `ng build --configuration=production` — verificar build
- [ ] 2.12 Ejecutar `ng test --watch=false` — verificar tests
- [ ] 2.13 Commit + tag `milestone-h2`

---

## Hito 3: v15 → v17 — UI dependencies (ng-bootstrap, charts, TinyMCE)

- [ ] 3.1 `ng update @angular/core@16 @angular/cli@16` — fix errores
- [ ] 3.2 `ng update @angular/core@17 @angular/cli@17` — fix errores
- [ ] 3.3 Actualizar TypeScript a 5.2 según requiera Angular 17
- [ ] 3.4 `npm install @ng-bootstrap/ng-bootstrap@17` — actualizar ng-bootstrap
- [ ] 3.5 Corregir usos de modales, dropdowns, datepickers y tooltips que cambien API
- [ ] 3.6 `npm install ng2-charts@6 chart.js@4` — actualizar charts
- [ ] 3.7 Reemplazar `ChartsModule` → `NgChartsModule` en `app.module.ts`
- [ ] 3.8 Actualizar todos los componentes con `<canvas baseChart>` a la API de ng2-charts v6
- [ ] 3.9 `npm install ngx-echarts@18` — actualizar ECharts wrapper
- [ ] 3.10 Actualizar config de `NgxEchartsModule.forRoot()` si cambia API
- [ ] 3.11 `npm install tinymce@7 @tinymce/tinymce-angular@8` — actualizar TinyMCE
- [ ] 3.12 Verificar assets de TinyMCE en `angular.json` (skins, themes, plugins, icons)
- [ ] 3.13 Revisar `angulartics2` — verificar compatibilidad o evaluar alternativa
- [ ] 3.14 Remover opción `defaultProject` de `angular.json` (deprecada v17)
- [ ] 3.15 Ejecutar `ng build --configuration=production` — verificar build
- [ ] 3.16 Ejecutar `ng test --watch=false` — verificar tests
- [ ] 3.17 Verificar visualmente: modales, gráficos, rich text editor funcionan
- [ ] 3.18 Commit + tag `milestone-h3`

---

## Hito 4: v17 → v19 — Final (OpenAPI, TypeScript 5.5)

- [ ] 4.1 Verificar Node.js ≥ 18.19 (requisito Angular 18+)
- [ ] 4.2 `ng update @angular/core@18 @angular/cli@18` — fix errores
- [ ] 4.3 `ng update @angular/core@19 @angular/cli@19` — fix errores
- [ ] 4.4 Actualizar TypeScript a 5.5+ según requiera Angular 19
- [ ] 4.5 Instalar `openapi-generator-cli` — `npm install @openapitools/openapi-generator-cli -D`
- [ ] 4.6 Actualizar `generate-api.js` para usar `openapi-generator-cli` en lugar del fork
- [ ] 4.7 Actualizar `generate-chain-api.js` ídem
- [ ] 4.8 Ejecutar `npm run generate-api` — verificar generación exitosa
- [ ] 4.9 Verificar que los services generados compilan con Angular 19

---

## Verificación Final

- [ ] 5.1 `ng build --configuration=production` — build limpio, 0 errores, 0 warnings de deprecación
- [ ] 5.2 `ng lint` — 0 errores ESLint
- [ ] 5.3 `ng test --watch=false` — todos los tests unitarios pasan
- [ ] 5.4 `npx playwright test` — tests e2e de smoke pasan (login, dashboard, companies)
- [ ] 5.5 `ng serve --configuration=dev --proxy-config proxy.INATrace-local.conf.json` — dev server funciona
- [ ] 5.6 Verificación manual: login, listado companies, value-chain, product labels, dashboard con charts
- [ ] 5.7 Commit final + tag `milestone-h4`
- [ ] 5.8 Abrir PR `chore/angular-migration` → `main`

---

**Status**: success  
**Summary**: Task breakdown creado: 5 fases, 54 tareas con checklist accionable por hito.  
**Artifacts**: `inatrace-frontend/doc/migracion/tasks-upgrade-angular.md` | Engram `sdd/angular-upgrade/tasks`  
**Next**: `sdd-apply`  
**Risks**: Ninguno adicional
