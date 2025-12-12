# Configuración de MapLibre - Guía Rápida

## Resumen

MapLibre GL JS es el proveedor de mapas **predeterminado** en el frontend. No requiere API keys para funcionar (usa OpenStreetMap como fallback).

## Configuración Rápida

### Opción 1: Sin API Key (OpenStreetMap)

```javascript
// src/assets/env.js
window['env']['useMapsGoogle'] = false;
window['env']['maptilerApiKey'] = '';
```

✅ **Ventajas:** Gratuito, sin límites de uso
⚠️ **Limitaciones:** Solo estilo de mapa básico, sin vista satelital de alta calidad

### Opción 2: Con MapTiler (Recomendado)

```javascript
// src/assets/env.js
window['env']['useMapsGoogle'] = false;
window['env']['maptilerApiKey'] = 'tu-api-key-aqui';
```

✅ **Ventajas:** Vista satelital, múltiples estilos, mejor rendimiento
💰 **Costo:** Plan gratuito disponible (100k requests/mes)

### Obtener API Key de MapTiler

1. Ir a [cloud.maptiler.com](https://cloud.maptiler.com/)
2. Crear cuenta gratuita
3. Crear nuevo API key
4. Copiar el key y pegarlo en `env.js`

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/assets/env.js` | Variables de ambiente producción |
| `src/assets/env.development.js` | Variables de ambiente desarrollo |
| `src/assets/env.template.js` | Template para CI/CD |
| `src/environments/environment.ts` | Lectura de variables |
| `src/environments/environment.prod.ts` | Lectura de variables (prod) |

## Variables de Ambiente

```javascript
// Configuración completa
window['env'] = {
  // ... otras variables ...
  
  // Control de proveedor de mapas
  useMapsGoogle: false,        // false = MapLibre, true = Google Maps
  
  // API Keys (dejar vacío si no se usa)
  googleMapsApiKey: '',        // Solo si useMapsGoogle = true
  maptilerApiKey: '',          // Opcional para MapLibre
  mapboxAccessToken: '',       // Legacy (componente de plots)
};
```

## Verificar Configuración

1. Abrir la aplicación en el navegador
2. Abrir DevTools → Console
3. Ejecutar: `console.log(window.env)`
4. Verificar valores de `useMapsGoogle` y `maptilerApiKey`

## Estilos Disponibles

### Con MapTiler API Key

| Estilo | Descripción |
|--------|-------------|
| **Satellite** | Imágenes satelitales de alta resolución |
| **Outdoors** | Mapa topográfico con terreno y senderos |

### Sin API Key (OSM)

| Estilo | Descripción |
|--------|-------------|
| **OSM Standard** | Mapa de calles básico de OpenStreetMap |

## Solución de Problemas

### Mapa no carga

```javascript
// Verificar en consola del navegador
console.log('useMapsGoogle:', window.env.useMapsGoogle);
console.log('maptilerApiKey:', window.env.maptilerApiKey);
```

### Tiles no cargan

- Verificar conectividad a internet
- Si usa MapTiler, verificar que el API key sea válido
- Revisar pestaña Network en DevTools por errores 401/403

### Error "Container not found"

- Verificar que el `mapId` del componente sea único
- Verificar que el contenedor tenga altura definida (no 0px)

## CI/CD

Para despliegues automatizados, usar `env.template.js`:

```javascript
// env.template.js
window.env = {
  useMapsGoogle: '${USE_MAPS_GOOGLE}' || 'false',
  maptilerApiKey: '${MAPTILER_API_KEY}' || '',
  // ...
};
```

Variables de entorno a configurar en el pipeline:
- `USE_MAPS_GOOGLE`: `false` o `true`
- `MAPTILER_API_KEY`: Tu API key de MapTiler
