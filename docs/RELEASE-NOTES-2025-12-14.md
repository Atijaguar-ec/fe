# Release Notes - 2025-12-14

## Alcance

Este release introduce el **sistema dual de mapas** en el frontend (MapLibre como default y Google Maps como legacy), controlado por la variable runtime `useMapsGoogle`.

Objetivo principal:
- Asegurar que los componentes que dependían de `<google-map>` tengan **fallback funcional** a MapLibre cuando `useMapsGoogle=false`.

## Commits incluidos

Rango (staging -> main): `b5d4584f..03492a5b`

- `03492a5b` fix: avoid MapLibre init before container exists in app-map
- `1f089dc5` fix: skip MapLibre init when WebGL unavailable (CI/tests)
- `7735d484` fix: use JourneyMarker interface instead of non-existent MapLibreMarker in product-label-statistics-page
- `aa8dcfa7` feat: add MapLibre fallback to product-label.component when USE_MAPS_GOOGLE=false
- `8b2ffe70` feat: add MapLibre fallback to geoaddress-form, batch-detail-page, product-label-statistics-page, and pathline-map when USE_MAPS_GOOGLE=false
- `bd90d33c` fix: add initial coordinates to MapLibre in location form
- `ba38a3b8` fix: show MapLibre map in facility location form when google maps disabled
- `a586be9e` fix: avoid cooperativeGestures on maplibre
- `6564c135` fix: unique mapId in company farmers list
- `b17d7718` fix: unique mapId and correct pin coords in plots form
- `75438130` fix: facilities map fallback to maplibre
- `90b74f10` fix: load env.local only on localhost
- `62dfb456` fix: lint maplibre journey input
- `82e8b74f` Configuracion de ci
- `8c8ed00a` Agregar configuraciôn para maplibre
- `b7c33c2a` Ajustes viso de mapas

## Cambios funcionales

### Nuevos componentes / wrappers

- `app-maplibre-journey-map`
  - Renderiza mapa MapLibre.
  - Soporta estilos (MapTiler si hay key; OSM como fallback).
  - Marcadores y polilínea.

- `app-journey-map`
  - Wrapper que elige Google o MapLibre según `useMapsGoogle`.

### Componentes con fallback MapLibre (cuando `useMapsGoogle=false`)

- `LocationFormNewComponent`
  - Pin único.
  - Sincroniza coordenadas con el formulario.

- `GeoaddressFormComponent`
  - Pin único.

- `BatchDetailPageComponent`
  - Coordenadas múltiples (sincronización con FormArray).

- `ProductLabelComponent`
  - Coordenadas múltiples (sincronización con FormArray).

- `ProductLabelStatisticsPageComponent`
  - Usa `app-maplibre-journey-map` para markers.

- `PathlineMapComponent`
  - Coordenadas múltiples.

- `CompanyDetailFacilitiesComponent`
  - Fallback a `app-maplibre-journey-map`.

## Cambios de configuración

### Variables runtime (window.env)

En `src/assets/env.template.js` se parametriza:
- `USE_MAPS_GOOGLE` -> `useMapsGoogle`
- `MAPTILER_API_KEY` -> `maptilerApiKey`
- `GOOGLE_MAPS_API_KEY` -> `googleMapsApiKey`

### CI/CD UNOCACE (GitHub Actions)

Workflow: `fe/.github/workflows/deploy-frontend-unocace.yml`

- Staging/Test:
  - `MAPTILER_API_KEY` se setea desde `TEST_UNOCACE_MAPTILER_API_KEY` (o fallback `MAPTILER_API_KEY`).

- Producción:
  - `MAPTILER_API_KEY` se setea desde `PROD_UNOCACE_MAPTILER_API_KEY` (o fallback `MAPTILER_API_KEY`).

## Fixes / Estabilidad

- **CI / Tests (ChromeHeadless sin WebGL)**
  - Se evita inicializar MapLibre si no hay soporte de WebGL.

- **Runtime: "Container not found"**
  - Se asegura que el contenedor exista antes de inicializar el mapa.
  - Se usa binding de id con `[id]="mapId"` y retry de inicialización.

## Checklist de verificación (post-deploy)

- Abrir `https://inatrace.unocace.com`
- Login
- Validar pantallas con mapas (al menos):
  - Product Label
  - Batch Detail
  - Geoaddress Form
- Verificar en DevTools:
  - `console.log(window.env.useMapsGoogle)`
  - `console.log(window.env.maptilerApiKey)`
- Si los tiles no cargan:
  - Revisar Network por 401/403 a MapTiler
  - Confirmar secrets `PROD_UNOCACE_MAPTILER_API_KEY`

## Notas

- `LocationFormComponent` (legacy) mantiene referencias a `<google-map>` pero el bloque de mapa está comentado en el template; revisar si aún se usa en la aplicación.
