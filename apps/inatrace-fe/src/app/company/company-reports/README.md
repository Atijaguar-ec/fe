# Módulo de Reportes BI y Estudio de Diseño (`company-reports`)

Este módulo integra **Apache Superset 6.0.0** dentro de INATrace separando dos planos bajo un modelo estricto *deny-by-default* (todo con permisos, sin acceso público):

1. **Consumo embebido (`/company-reports`):** utiliza `@superset-ui/embedded-sdk` (`0.4.0`) y *guest tokens* emitidos por `backend/` (`/api/bi/guest-token`), sin solicitar un segundo login al operador y con el rol `Public` de Superset purgado a 0 permisos.
2. **Estudio de Reportes (`/company-reports/studio`):** accesible exclusivamente para `SYSTEM_ADMIN` y `REGIONAL_ADMIN` mediante `SystemOrRegionalAdminGuardService`; embebe la interfaz nativa de Superset (`/bi/`) vía `iframe` *same-origin* autenticado con Keycloak OIDC (`Admin`/`Alpha`) sobre las vistas `bi.*` de solo lectura y permite registrar tableros personalizados en `company.configuration.customBiDashboards`.

---

## 1. Arquitectura de Tableros — Fortaleza del Valle (`fortaleza`)

En `fortaleza-staging`, el catálogo oficial aprovisionado en Superset consta de **5 datasets**, **7 dashboards** y **14 charts** (tablas `raw` de detalle y `aggregate` de totales con 30 filtros nativos horizontales):

1. `fortaleza-cacao-arqueo-bascula-staging` — **REGISTRO DE PESO POR PRODUCTOR**
2. `fortaleza-cacao-fermentacion-staging` — **REG. RECEPCIÓN Y FERMENTACIÓN**
3. `fortaleza-cacao-almacenamiento-staging` — **REG. INGRESO ALMACENAMIENTO**
4. `fortaleza-cacao-secado-staging` — **REG. SECADO**
5. `fortaleza-cacao-existencia-staging` — **CACAO EN EXISTENCIA**
6. `fortaleza-cacao-salidas-staging` — **REGISTRO DE SALIDA**
7. `fortaleza-cacao-cuarentena-calificacion-staging` — **Cuarentena y Calificación**

El reporte `cacao-compras-certificadas` permanece estrictamente excluido para Fortaleza del Valle tanto en Superset como en `BiReportsService`.

---

## 2. Reglas de Seguridad y Publicación desde el Estudio

* Los tableros diseñados en `/company-reports/studio` **no** deben usar el prefijo `{org}-cacao-` en su `slug` para evitar ser eliminados por `setup_cacao_superset.py`.
* El diseñador debe guardar todos los gráficos en Superset (persistiendo `query_context`), usar únicamente las vistas `bi.*` autorizadas para la organización y activar *Embed dashboard* con el origen HTTPS del portal antes de publicarlos en el panel de INATrace.
* Cada tablero personalizado exige al menos un rol en `allowedRoles` (`USER`, `COMPANY_ADMIN`, `REGIONAL_ADMIN`, `SYSTEM_ADMIN`).

---

## 3. Compilación y Despliegue en Staging

```bash
cd fe
NX_DAEMON=false npm run build:prod
```

Para pruebas unitarias del módulo:

```bash
cd fe
NX_DAEMON=false npx nx test inatrace-fe --watch=false --browsers=ChromeHeadless --include=apps/inatrace-fe/src/app/company/company-reports/**/*.spec.ts
```
