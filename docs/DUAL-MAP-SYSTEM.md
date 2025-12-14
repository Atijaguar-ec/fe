# Sistema Dual de Mapas - MapLibre / Google Maps

## Descripción General

El sistema de mapas del frontend soporta dos proveedores de mapas:

1. **MapLibre GL JS** (predeterminado) - Open source, usa tiles de MapTiler u OpenStreetMap
2. **Google Maps** (legacy) - Requiere API key de Google

La selección del proveedor se controla mediante la variable de ambiente `useMapsGoogle`.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    window.env (Runtime)                         │
│  useMapsGoogle: false | true                                    │
│  maptilerApiKey: '' | 'your-key'                               │
│  googleMapsApiKey: '' | 'your-key'                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              environment.ts / environment.prod.ts               │
│  useMapsGoogle: parseBoolean(env.useMapsGoogle, false)         │
│  maptilerApiKey: env.maptilerApiKey || ''                      │
│  googleMapsApiKey: env.googleMapsApiKey || ''                  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌──────────────────────┐             ┌──────────────────────────┐
│  useMapsGoogle=true  │             │   useMapsGoogle=false    │
│   (Google Maps)      │             │      (MapLibre)          │
└──────────────────────┘             └──────────────────────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────────┐             ┌──────────────────────────┐
│ app.component.ts     │             │ MaplibreJourneyMap       │
│ loadGoogleMaps()     │             │ ├─ MapTiler (con key)    │
│ (carga script API)   │             │ └─ OSM (fallback)        │
└──────────────────────┘             └──────────────────────────┘
```

## Configuración

### Variables de Ambiente

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `useMapsGoogle` | boolean | `false` | `true` = Google Maps, `false` = MapLibre |
| `googleMapsApiKey` | string | `''` | API Key de Google Maps (requerido si useMapsGoogle=true) |
| `maptilerApiKey` | string | `''` | API Key de MapTiler (opcional, OSM como fallback) |
| `mapboxAccessToken` | string | `''` | Token de Mapbox (legacy, para componente de plots) |

### Archivos de Configuración

```
src/assets/
├── env.js                 # Producción (valores default)
├── env.development.js     # Desarrollo local
└── env.template.js        # Template para CI/CD (envsubst)
```

## Nota sobre `ng serve --configuration=dev`

El script `npm run dev` usa `ng serve --configuration=dev`.

- En esta implementación **no se usa** `environment.dev.ts`.
- `angular.json` está configurado para que `dev` (y `test`) utilicen `environment.ts`, el cual lee valores desde `window.env`.

Esto evita inconsistencias de tipos y permite activar/desactivar proveedores de mapas únicamente por runtime env (`env.js`).

#### Ejemplo: Usar MapLibre con MapTiler
```javascript
// env.js
window['env']['useMapsGoogle'] = false;
window['env']['maptilerApiKey'] = 'tu-api-key-maptiler';
window['env']['googleMapsApiKey'] = '';
```

#### Ejemplo: Usar Google Maps (legacy)
```javascript
// env.js
window['env']['useMapsGoogle'] = true;
window['env']['googleMapsApiKey'] = 'tu-api-key-google';
window['env']['maptilerApiKey'] = '';
```

#### Ejemplo: Usar MapLibre con OSM (sin API key)
```javascript
// env.js
window['env']['useMapsGoogle'] = false;
window['env']['maptilerApiKey'] = '';
window['env']['googleMapsApiKey'] = '';
```

## Componentes

### 1. JourneyMapComponent (Wrapper)

**Selector:** `<app-journey-map>`

**Ubicación:** `src/app/shared/journey-map/`

**Descripción:** Componente wrapper que selecciona automáticamente entre Google Maps y MapLibre según la configuración.

**Inputs:**
| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `mapId` | string | `'journey-map'` | ID único del contenedor del mapa |
| `height` | string | `'380px'` | Altura del mapa |
| `width` | string | `'100%'` | Ancho del mapa |
| `markers` | `{lat, lng}[]` | `[]` | Array de marcadores |
| `polylinePath` | `{lat, lng}[]` | `[]` | Puntos de la polilínea |
| `defaultCenter` | `{lat, lng}` | Ecuador | Centro inicial del mapa |
| `defaultZoom` | number | `2` | Zoom inicial |
| `boundsPadding` | number | `50` | Padding para fitBounds |
| `showStyleSelector` | boolean | `false` | Mostrar selector satellite/map |

**Uso:**
```html
<app-journey-map
  mapId="my-map"
  height="400px"
  width="100%"
  [markers]="markers"
  [polylinePath]="polylinePath"
  [defaultCenter]="{lat: -1.83, lng: -78.18}"
  [defaultZoom]="7"
  [showStyleSelector]="true">
</app-journey-map>
```

### 2. MaplibreJourneyMapComponent

**Selector:** `<app-maplibre-journey-map>`

**Ubicación:** `src/app/shared/maplibre-journey-map/`

**Descripción:** Componente de mapa usando MapLibre GL JS. Soporta MapTiler y OpenStreetMap.

**Características:**
- Estilos: Satellite y Outdoors
- Marcadores personalizados con labels
- Polilíneas con estilo punteado
- Auto-fit a bounds
- Selector de estilos opcional
- Fallback a OSM si no hay API key de MapTiler

**Inputs Adicionales:**
| Input | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `markersForm` | FormArray | `null` | FormArray reactivo para edición |
| `editMode` | boolean | `false` | Habilitar edición de marcadores |
| `showPolyline` | boolean | `false` | Mostrar polilínea |
| `polylineColor` | string | `'#25265E'` | Color de la polilínea |
| `polylineWidth` | number | `2` | Ancho de la polilínea |
| `markerColor` | string | `'#25265E'` | Color de los marcadores |
| `autoFitBounds` | boolean | `true` | Auto-ajustar vista |

**Outputs:**
| Output | Tipo | Descripción |
|--------|------|-------------|
| `mapClick` | `{lat, lng, originalEvent}` | Click en el mapa |
| `mapDblClick` | `{lat, lng, originalEvent}` | Doble click en el mapa |
| `markerClick` | `{index, marker}` | Click en marcador |
| `markerDragEnd` | `{index, lat, lng}` | Fin de drag de marcador |
| `mapReady$` | `maplibregl.Map` | Mapa listo |

## Estilos de Mapa

### MapLibre con MapTiler

| Estilo | URL | Descripción |
|--------|-----|-------------|
| Satellite | TileJSON API | Imágenes satelitales |
| Outdoors | `outdoor-v2/style.json` | Mapa topográfico |

### MapLibre con OSM (Fallback)

Cuando no hay `maptilerApiKey`, se usan tiles de OpenStreetMap:
- `https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`
- `https://b.tile.openstreetmap.org/{z}/{x}/{y}.png`
- `https://c.tile.openstreetmap.org/{z}/{x}/{y}.png`

## Migración de Componentes

### Componentes Migrados

| Componente | Estado | Notas |
|------------|--------|-------|
| `B2cJourneyComponent` | ✅ Migrado | Usa `<app-journey-map>` |
| `LocationFormNewComponent` | ✅ Migrado | Fallback a `<app-map>` (pin único) cuando `useMapsGoogle=false` |
| `GeoaddressFormComponent` | ✅ Migrado | Fallback a `<app-map>` (pin único) cuando `useMapsGoogle=false` |
| `BatchDetailPageComponent` | ✅ Migrado | Fallback a `<app-map>` y sincronización FormArray ↔ coordenadas |
| `ProductLabelComponent` | ✅ Migrado | Fallback a `<app-map>` y sincronización FormArray ↔ coordenadas |
| `ProductLabelStatisticsPageComponent` | ✅ Migrado | Fallback a `<app-maplibre-journey-map>` |
| `PathlineMapComponent` | ✅ Migrado | Fallback a `<app-map>` y sincronización de coordenadas |
| `CompanyDetailFacilitiesComponent` | ✅ Migrado | Fallback a `<app-maplibre-journey-map>` |

### Componentes Pendientes

| Componente | Proveedor Actual | Acción Requerida |
|------------|------------------|------------------|
| `LocationFormComponent` | Google Maps (legacy) | Revisar si aún se usa; el mapa está comentado en el template |

## Carga Condicional

### Google Maps Script

El script de Google Maps solo se carga cuando `useMapsGoogle=true`:

```typescript
// app.component.ts
ngOnInit() {
  if (environment.useMapsGoogle && !!environment.googleMapsApiKey) {
    this.loadGoogleMaps();
  }
}
```

### CSS de MapLibre

El CSS de MapLibre se importa localmente (no CDN):

```scss
// styles.scss
@import '~maplibre-gl/dist/maplibre-gl.css';
```

## Dependencias

```json
{
  "dependencies": {
    "maplibre-gl": "1.15.3",
    "@angular/google-maps": "^10.x",
    "mapbox-gl": "^1.13.0"
  }
}
```

## Troubleshooting

### El mapa no se muestra

1. Verificar que el contenedor tenga altura definida
2. Verificar que el `mapId` sea único en la página
3. Revisar la consola por errores de API key

### Tiles no cargan

1. Si usa MapTiler: verificar que `maptilerApiKey` esté configurado
2. Si usa OSM: verificar conectividad a internet
3. Verificar CORS si hay errores de red

### Google Maps no carga

1. Verificar que `useMapsGoogle=true`
2. Verificar que `googleMapsApiKey` esté configurado
3. Verificar que el dominio esté autorizado en Google Cloud Console

## CI/CD (UNOCACE)

El frontend consume `MAPTILER_API_KEY` desde `env.template.js` (vía `envsubst`).

- En **staging/test**, el pipeline setea `MAPTILER_API_KEY` desde `TEST_UNOCACE_MAPTILER_API_KEY`.
- En **producción**, el pipeline setea `MAPTILER_API_KEY` desde `PROD_UNOCACE_MAPTILER_API_KEY`.

## Referencias

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)
- [MapTiler](https://www.maptiler.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Angular Google Maps](https://github.com/angular/components/tree/main/src/google-maps)
