# Archive Report: angular-upgrade

**Change**: angular-upgrade  
**Fecha**: 2026-03-23  
**Rama**: `chore/angular-migration`  
**Status**: ✅ COMPLETAMENTE VERIFICADO Y ARCHIVADO

---

## Stack Inicial vs Final

| Componente        | Antes         | Después         |
| ----------------- | ------------- | --------------- |
| Angular           | 15.2.10 (EOL) | **19.2.20**     |
| Angular CLI       | 15.2.11       | **19.2.22**     |
| TypeScript        | 4.9.5         | **5.8.3**       |
| zone.js           | 0.11.x        | **0.15.1**      |
| Node.js (runtime) | 14 (EOL)      | **18.20.8 LTS** |
| Build system      | Webpack       | **esbuild**     |

---

## Hito 3: Angular 15 → 17 (tag: `milestone-h3-v17`)

| Acción                                            | Detalle                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| Node.js 14 → 18.20.8 LTS                          | Prerequisito para Angular 16+                                      |
| `ng update @angular/core@16 @angular/cli@16`      | Angular 16.2.12                                                    |
| `ng update @angular/core@17 @angular/cli@17`      | Angular 17.3.12                                                    |
| TypeScript 4.9.5 → 5.4.5                          | Auto por ng update                                                 |
| zone.js 0.11 → 0.14.10                            | Auto por ng update                                                 |
| `@ng-select/ng-select` 4 → 13                     | Compatibilidad Ivy                                                 |
| `@angular/google-maps` 10 → 16                    | Compatibilidad Ivy                                                 |
| `@angular/cdk` 10 → 16                            | Peer dep                                                           |
| `@ng-bootstrap/ng-bootstrap` 6 → 16               | Compatibilidad Ivy                                                 |
| `@fortawesome/angular-fontawesome` 0.6 → 0.13     | Compatibilidad Ivy                                                 |
| `@tinymce/tinymce-angular` 4 → 7                  | Compatibilidad Ivy                                                 |
| `ng2-file-upload` 1 → 3                           | Compatibilidad Ivy                                                 |
| `ngx-filesaver` 10 → 13                           | Peer dep                                                           |
| `ngx-echarts` 6 → 16                              | Compatibilidad Ivy                                                 |
| `ngx-toastr` 12 → 19                              | Compatibilidad Ivy                                                 |
| `ng2-charts` 2 → 5 + `chart.js` 4                 | API actualizada                                                    |
| `angulartics2` 9 → 13                             | Sub-entries consolidadas                                           |
| `ChartsModule` → `NgChartsModule`                 | Breaking change ng2-charts v3+                                     |
| `google.maps.MouseEvent` → `MapMouseEvent`        | 6 archivos                                                         |
| `angular2-qrcode` eliminado                       | Reemplazado con `QrCodeModule` propio en `src/app/shared/qr-code/` |
| `angulartics2/gst` + `/facebook` → `angulartics2` | Sub-entries eliminadas en v13                                      |
| Path alias `@app/*` en `tsconfig.base.json`       | Para imports absolutos                                             |

**Commit**: `9b2a7f7b` + `7a478b9f` — 26 archivos

---

## Hito 4: Angular 17 → 19 (tag: `milestone-h4-v19`)

| Acción                                       | Detalle                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ng update @angular/core@18 @angular/cli@18` | Angular 18.2.14                                                                                    |
| `HttpClientModule` → `provideHttpClient()`   | 42 archivos auto-migrados (schematics)                                                             |
| `ng update @angular/core@19 @angular/cli@19` | Angular 19.2.20                                                                                    |
| TypeScript 5.4.5 → 5.8.3                     | Auto por ng update                                                                                 |
| zone.js 0.14.10 → 0.15.1                     | Auto por ng update                                                                                 |
| 250+ componentes → `standalone: false`       | Auto por schematics Angular 19                                                                     |
| `angular.json` → esbuild application builder | Migrado por schematics                                                                             |
| TS2869 corregido                             | `Number(x - y ?? 0)` → `Number(x - (y ?? 0))` en `stock-processing-order-details.component.ts:831` |
| OpenAPI generator                            | Fork personalizado compatible, `src/api/` ya migrado por schematics Angular 18                     |

**Commits**: `c15fe442` (Angular 18) + `795cd328` (Angular 19)

---

## Verificación Final

| Verificación              | Resultado                          |
| ------------------------- | ---------------------------------- |
| `ng build`                | ✅ Application bundle [20s]        |
| `ng test --watch=false`   | ✅ **43/43 PASS** (ChromeHeadless) |
| `ng serve` — landing page | ✅ Carga con estilos completos     |
| `ng serve` — login page   | ✅ Renderiza perfectamente         |
| Error `NG04016`           | ✅ ELIMINADO                       |

---

## Fixes Adicionales Post-Migración

### fix(styles) — commit `0afadf21`

`src/styles.scss` línea 4 — ng-select@13 usa rutas relativas en su SCSS que karma/webpack no puede resolver:

```diff
- @import "@ng-select/ng-select/scss/default.theme.scss";
+ @import "@ng-select/ng-select/themes/default.theme.css";
```

### fix(router) — commit `4cc34161`

`app-routing.module.ts` — eliminada ruta `path: '' → redirectTo: '/'` circular que Angular 17+ detecta como `NG04016`:

```diff
- {
-   path: '',
-   redirectTo: '/',
-   pathMatch: 'full'
- },
  {
    path: '',
    component: LandingPageLayoutComponent,
    ...
  },
```

---

## Todos los Commits

```
9b2a7f7b  chore(angular): migrate to v16
7a478b9f  chore(angular): migrate to v17    ← tag milestone-h3-v17
c15fe442  chore(angular): migrate to v18
795cd328  chore(angular): migrate to v19    ← tag milestone-h4-v19
8538a48f  docs(sdd): archive angular-upgrade
0afadf21  fix(styles): use precompiled CSS for ng-select@13 theme
4cc34161  fix(router): remove circular redirectTo causing NG04016
```

---

## Artefactos SDD

| Artefacto   | Archivo                          | Engram                                   |
| ----------- | -------------------------------- | ---------------------------------------- |
| Exploración | `exploracion-upgrade-angular.md` | —                                        |
| Propuesta   | `propuesta-upgrade-angular.md`   | `#4 sdd/angular-upgrade/proposal`        |
| Specs       | `specs-upgrade-angular.md`       | —                                        |
| Design      | `design-upgrade-angular.md`      | —                                        |
| Tasks       | `tasks-upgrade-angular.md`       | —                                        |
| Archive     | este archivo                     | `#14 sdd/angular-upgrade/archive-report` |

---

## Pendiente (futura sesión)

| Ítem                                                        | Prioridad                    |
| ----------------------------------------------------------- | ---------------------------- |
| `npm run generate-api` (requiere backend en localhost:8080) | BAJA                         |
| PR `chore/angular-migration` → `main`                       | Cuando esté listo para merge |

---

## SDD Cycle

✅ **Explore → Propose → Spec → Design → Tasks → Apply → Verify → Archive**

**Ciclo completamente cerrado. Trabajando de forma local en `chore/angular-migration`.**
