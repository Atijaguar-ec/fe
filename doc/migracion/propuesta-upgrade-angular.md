# Proposal: Upgrade Angular 10 → 19

## Intent

inatrace-frontend está en Angular 10 (julio 2020), 9 versiones mayores de atraso. El soporte oficial (LTS y security) expiró hace años. Dependencias críticas están deprecadas (TSLint, Protractor) y la brecha de seguridad y compatibilidad crece con cada versión.

**Objetivos**:
- Eliminar deuda técnica acumulada en 5+ años
- Restablecer soporte de seguridad y actualizaciones
- Habilitar nuevas capacidades (Standalone API, Signals, SSR)
- Desbloquear actualizaciones de dependencias de terceros

## Scope

### In Scope
- Actualizar Angular core + CLI de v10 a v19 (incremental)
- Migrar TSLint + codelyzer → ESLint + @angular-eslint
- Reemplazar Protractor → Playwright para e2e
- Actualizar TypeScript 3.9 → 5.5+
- Actualizar RxJS 6.5 → 7.8
- Actualizar dependencias UI: ng-bootstrap 6→17, ng2-charts 2→6, ngx-echarts 6→18, TinyMCE 5→7
- Evaluar y migrar `openapi-typescript-angular-generator`
- Actualizar `angular.json` (remover opciones deprecadas: `extractCss`, `vendorChunk`, etc.)
- Documentar cada hito en `doc/migracion/`

### Out of Scope
- Migración a Standalone Components (evaluación solo — adopción opcional)
- Rediseño UI / cambio visual del frontend
- Migración CSS Bootstrap 4 → 5
- Migración de Karma/Jasmine → Jest (evaluación solo)
- Cambios al backend (Spring Boot)

## Approach

**Migración incremental por versión mayor** usando `ng update`, siguiendo `update.angular.io`. Agrupada en 4 hitos:

| Hito | Versiones | Entregables clave |
|------|-----------|-------------------|
| H1 | v10 → v12 | ESLint, Playwright, remover deprecados |
| H2 | v12 → v15 | RxJS 7, `provideRouter`, `provideHttpClient` |
| H3 | v15 → v17 | ng-bootstrap, ng2-charts, ngx-echarts, evaluar Standalone |
| H4 | v17 → v19 | Generador OpenAPI, evaluar Signals |

Cada hito incluye: actualización core → actualización deps → fix compilación → run tests → commit.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `package.json` | Modified | Todas las dependencias @angular/* + terceros |
| `angular.json` | Modified | Opciones build deprecadas, nuevo builder |
| `tsconfig*.json` | Modified | Target, module, lib — por requisitos TypeScript 5 |
| `tslint.json` | Removed | Reemplazado por `.eslintrc.json` |
| `.eslintrc.json` | New | Configuración ESLint + @angular-eslint |
| `e2e/` | Removed | Protractor → reemplazado por Playwright tests |
| `playwright/` o `e2e/` | New | Tests e2e con Playwright |
| `src/app/app.module.ts` | Modified | Imports actualizados, módulos cambiados |
| `src/app/**/*.module.ts` | Modified | Importaciones de módulos actualizados |
| `src/app/core/token.interceptor.ts` | Modified | HTTP interceptor pattern cambia en v15+ |
| `generate-api.js` | Modified | Evaluar re-generación con nuevo tooling |
| `karma.conf.js` | Modified | Compatibilidad con nuevas versiones |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| `openapi-typescript-angular-generator` incompatible | Alta | Evaluar `openapi-generator-cli` como alternativa |
| `ng2-charts` API totalmente reescrita (v2→v6) | Alta | Auditar todos los usos de `<canvas baseChart>` antes |
| Build roto en saltos intermedios | Media | Commit por cada `ng update` exitoso |
| `angulartics2` sin soporte Angular 19 | Media | Evaluar fork o alternativa |
| Templates con APIs deprecadas de Angular | Media | Schematics automáticos cubren la mayoría |
| node_modules con peer dependency conflicts | Media | Usar `--force` selectivamente, resolver manualmente |

## Rollback Plan

1. **Rama dedicada**: Todo el trabajo en `chore/angular-migration`
2. **Commits por hito**: Cada hito es un commit (o PR) independiente
3. **Rollback por hito**: `git revert` del merge commit del hito problemático
4. **Rollback total**: La rama `main` permanece intacta hasta merge final
5. **Respaldo de `package-lock.json`**: Snapshot antes de cada hito

## Dependencies

- Node.js ≥ 18.19 LTS instalado (requerido para Angular 17+)
- Acceso a npm registry para descargar paquetes actualizados
- Acceso al backend API para re-generar clientes OpenAPI

## Success Criteria

- [ ] `ng build --configuration=production` compila sin errores en Angular 19
- [ ] `ng lint` pasa con ESLint (TSLint eliminado)
- [ ] Tests unitarios (`ng test`) pasan
- [ ] Tests e2e con Playwright pasan (al menos los flujos principales)
- [ ] Aplicación funciona correctamente en el navegador (flujos críticos: login, company, value-chain, products)
- [ ] `ng serve` con proxy a backend funciona para desarrollo local
- [ ] No hay warnings de deprecación en la consola de build

---

**Status**: success  
**Summary**: Propuesta creada para `angular-upgrade`. 9 deliverables in scope, 5 deferred. Migración incremental en 4 hitos.  
**Artifacts**: `inatrace-frontend/doc/migracion/propuesta-upgrade-angular.md` | Engram `sdd/angular-upgrade/proposal`  
**Next**: `sdd-spec` o `sdd-design`  
**Risks**: openapi-generator incompatibilidad (alta), ng2-charts reescrita (alta)
