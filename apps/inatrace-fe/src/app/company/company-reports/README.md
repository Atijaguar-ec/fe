# Módulo de Reportes BI y Visualización de Dashboards (`company-reports`)

Este módulo integra los tableros analíticos de **Apache Superset 6.0.0** dentro de la interfaz web de INATrace mediante una barra de navegación por pestañas y un contenedor iframe seguro y responsivo.

---

## 1. Arquitectura Multi-Tenant (Fortaleza del Valle vs. UNOCACE)

Cada organización (tenant) posee flujos comerciales y operacionales diferentes:

| Parámetro | Fortaleza del Valle (`fortaleza`) | UNOCACE (`unocace`) |
|:---|:---|:---|
| **Materia Prima Comprada** | 100% Cacao en Baba (el beneficio ocurre en sus plantas Matriz y Quiroga). | Cacao en Baba y Cacao Seco (liquidado en compra al productor). |
| **Pestaña Inicial / Principal** | **Balance de Masas & Beneficio** (`cacao-beneficio-balance`) | **Agrocalidad (Sistema GUIA)** (`cacao-agrocalidad-guia`) |
| **Reporte de Compras Certificadas** | **EXCLUIDO TOTALMENTE** (No aplica al modelo de Fortaleza del Valle). | **INCLUIDO** (`cacao-compras-certificadas`) para liquidación comercial. |
| **Formato de Visualización** | **100% Tablas Interactivas** a ancho completo (`width: 12`). Cero indicadores KPI. | **100% Tablas Interactivas** a ancho completo (`width: 12`). Cero indicadores KPI. |

---

## 2. Pestañas de Navegación por Organización

### 2.1. Fortaleza del Valle (`fortaleza`)
1. `beneficio`: **Balance de Masas & Beneficio** (`slugSuffix: cacao-beneficio-balance`)
   - Cuadro general de mermas escalonadas (15%, 10%, 45%, 5%) y rotación de colores (`ROJO`, `AZUL`, `BLANCO`, `VERDE`, `AMARILLO`).
   - Registro de recepción y fermentación (cajones).
   - Registro de secado-semiseco (marquesinas y tendales solares).
   - Registro de secado final y ensacado (sacos de 69 kg y remanente estricto `< 69 kg`).
2. `agrocalidad`: **Agrocalidad (Sistema GUIA)** (`slugSuffix: cacao-agrocalidad-guia`)
3. `acopio`: **Acopio Semanal & Calidad** (`slugSuffix: cacao-acopio-calidad`)
4. `procesos`: **Rendimientos & Procesamiento** (`slugSuffix: cacao-procesos-rendimientos`)
5. `parcelas`: **Productores & Parcelas** (`slugSuffix: cacao-productores-parcelas`)
6. `pagos`: **Liquidación & Pagos** (`slugSuffix: cacao-pagos-conciliacion`)

### 2.2. UNOCACE (`unocace`)
1. `agrocalidad`: **Agrocalidad (Sistema GUIA)** (`slugSuffix: cacao-agrocalidad-guia`)
2. `compras`: **Compras Certificadas** (`slugSuffix: cacao-compras-certificadas`)
3. `acopio`: **Acopio Semanal & Calidad** (`slugSuffix: cacao-acopio-calidad`)
4. `procesos`: **Rendimientos & Procesamiento** (`slugSuffix: cacao-procesos-rendimientos`)
5. `parcelas`: **Productores & Parcelas** (`slugSuffix: cacao-productores-parcelas`)
6. `pagos`: **Liquidación & Pagos** (`slugSuffix: cacao-pagos-conciliacion`)

---

## 3. Resolución Dinámica del Tenant (`resolveOrgSlug`)

En [`company-reports.component.ts`](./company-reports.component.ts), el método `resolveOrgSlug()` determina el tenant activo evaluando las siguientes fuentes en orden de prioridad:

1. `EnvironmentInfoService.companyName` (configurado en tiempo de ejecución por `env.js` o variable de entorno del contenedor Docker).
2. `window['env']['keycloakRealm']` o `environment.keycloakRealm`.
3. `window.location.hostname` (detecta `espam` / `fortaleza` para preproducción).
4. Fallback seguro a `fortaleza`.

---

## 4. Procedimiento de Compilación y Despliegue en Staging

Para aplicar cambios en este componente al servidor de Staging de Fortaleza del Valle (`https://testinatrace.espam.edu.ec`):

```bash
# 1. Compilar el frontend en modo producción
NX_DAEMON=false npm run build:prod

# 2. Empaquetar y transferir al servidor
tar -czf /tmp/fe-dist.tar.gz -C dist/apps/inatrace-fe .
scp -i ~/.ssh/cedia_key /tmp/fe-dist.tar.gz giz@190.15.143.254:/tmp/

# 3. Aplicar en el contenedor Docker y recargar Nginx
ssh -i ~/.ssh/cedia_key giz@190.15.143.254 "
  docker exec inatrace-frontend cp /app/assets/env.js /tmp/env.js.bak && \
  docker cp /tmp/fe-dist.tar.gz inatrace-frontend:/tmp/fe-dist.tar.gz && \
  docker exec inatrace-frontend tar -xzf /tmp/fe-dist.tar.gz -C /app && \
  docker exec inatrace-frontend cp /tmp/env.js.bak /app/assets/env.js && \
  docker exec inatrace-frontend rm -f /tmp/fe-dist.tar.gz /tmp/env.js.bak && \
  docker exec inatrace-frontend nginx -s reload
"

# 4. Confirmar y subir a la rama staging de Git para persistencia en CI/CD
git commit -am "feat(reports): actualizar navegación de reportes BI"
git push origin staging
```
