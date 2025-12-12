# Archivos Modificados - Sistema Dual de Mapas

## Fecha de Implementación
Diciembre 2024

## Resumen de Cambios

### Archivos de Configuración de Ambiente

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/assets/env.js` | 15-19 | Agregado `useMapsGoogle`, `maptilerApiKey` |
| `src/assets/env.development.js` | 13-17 | Agregado `useMapsGoogle`, `maptilerApiKey` |
| `src/assets/env.template.js` | 27-29, 44, 54-57 | Placeholders para CI/CD |
| `src/environments/environment.ts` | 7-15, 31, 35 | `parseBoolean()`, lectura de variables |
| `src/environments/environment.prod.ts` | 7-15, 31, 35 | `parseBoolean()`, lectura de variables |

### Componente Principal

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/app/app.component.ts` | 20-42 | Carga condicional de Google Maps |

### Configuración Angular (build/serve)

| Archivo | Cambios |
|---------|---------|
| `angular.json` | En `build.configurations.dev` y `build.configurations.test` se eliminó el `fileReplacements` hacia `src/environments/environment.dev.ts` para evitar errores TS2339 en modo dev. |

### Estilos Globales

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/styles.scss` | 6-7 | Import de CSS mapbox-gl y maplibre-gl |

### Nuevos Componentes MapLibre

| Archivo | Descripción |
|---------|-------------|
| `src/app/shared/maplibre-journey-map/maplibre-journey-map.component.ts` | Componente principal MapLibre |
| `src/app/shared/maplibre-journey-map/maplibre-journey-map.component.html` | Template con selector de estilos |
| `src/app/shared/maplibre-journey-map/maplibre-journey-map.component.scss` | Estilos del componente |

### Wrapper de Mapas

| Archivo | Descripción |
|---------|-------------|
| `src/app/shared/journey-map/journey-map.component.ts` | Wrapper Google/MapLibre |
| `src/app/shared/journey-map/journey-map.component.html` | Template condicional |
| `src/app/shared/journey-map/journey-map.component.scss` | Estilos mínimos |

### Módulo Compartido

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/app/shared/shared.module.ts` | 76-77, 139-140, 215-216 | Declaración y exportación de componentes |

### Componentes Migrados

| Archivo | Cambios |
|---------|---------|
| `src/app/b2c/b2c-page/b2c-journey/b2c-journey.component.ts` | Removido código Google Maps, simplificado |
| `src/app/b2c/b2c-page/b2c-journey/b2c-journey.component.html` | Cambiado `<google-map>` por `<app-journey-map>` |

### Dependencias

| Archivo | Cambios |
|---------|---------|
| `package.json` | Agregado `maplibre-gl: ^1.15.3` |

## Estructura de Archivos Nuevos

```
src/app/shared/
├── journey-map/                          # Wrapper
│   ├── journey-map.component.ts
│   ├── journey-map.component.html
│   └── journey-map.component.scss
│
└── maplibre-journey-map/                 # MapLibre
    ├── maplibre-journey-map.component.ts
    ├── maplibre-journey-map.component.html
    └── maplibre-journey-map.component.scss
```

## Código Clave

### parseBoolean (environment.ts)

```typescript
const parseBoolean = (value: any, defaultValue: boolean): boolean => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return defaultValue;
};

export const environment = {
    // ...
    useMapsGoogle: parseBoolean(env.useMapsGoogle, false),
    maptilerApiKey: env.maptilerApiKey || '',
    // ...
};
```

### Carga Condicional Google Maps (app.component.ts)

```typescript
ngOnInit() {
    if (environment.useMapsGoogle && !!environment.googleMapsApiKey) {
        this.loadGoogleMaps();
    }
}
```

### Selector de Proveedor (journey-map.component.html)

```html
<ng-container *ngIf="useGoogle; else maplibre">
  <google-map *ngIf="googleMapsLoaded" ...>
    <!-- Google Maps -->
  </google-map>
</ng-container>

<ng-template #maplibre>
  <app-maplibre-journey-map ...>
  </app-maplibre-journey-map>
</ng-template>
```

### Estilos MapTiler/OSM (maplibre-journey-map.component.ts)

```typescript
private createStyle(style: 'satellite' | 'outdoors'): any {
    const maptilerKey = environment.maptilerApiKey;
    
    if (maptilerKey) {
        // Usar MapTiler
        if (style === 'outdoors') {
            return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`;
        }
        return { /* satellite tiles config */ };
    }
    
    // Fallback a OSM
    return {
        version: 8,
        sources: {
            'osm-tiles': {
                type: 'raster',
                tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', ...],
                tileSize: 256
            }
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm-tiles' }]
    };
}
```

## Verificación

Para verificar que todo funciona:

```bash
cd fe
npm run build
# Debe completar sin errores (solo warnings de CommonJS)
```
