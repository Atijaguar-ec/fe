# CHANGELOG

Todas las modificaciones y mejoras relevantes del proyecto se documentan aquí.

---

## [2.1.0] - 2025-12-14
### Sistema dual de mapas (MapLibre / Google Maps)
- Implementación de fallback a MapLibre para componentes que antes dependían exclusivamente de Google Maps cuando `useMapsGoogle=false`.
- Sincronización de coordenadas desde MapLibre hacia formularios (modo pin único y multi-pin según componente).
- Ajustes de estabilidad:
  - Prevención de fallos en CI/tests cuando no hay WebGL disponible (ChromeHeadless).
  - Prevención de error en runtime "Container not found" por inicialización antes de que exista el contenedor.
- Notas de despliegue UNOCACE:
  - En staging se utiliza `TEST_UNOCACE_MAPTILER_API_KEY` (si existe) como `MAPTILER_API_KEY`.
  - En producción se utiliza `PROD_UNOCACE_MAPTILER_API_KEY` (si existe) como `MAPTILER_API_KEY`.

## [2.0.0] - 2025-07-11
### Mejoras en documentación y experiencia de usuario
- README-es.md completamente reescrito y mejorado:
  - Redacción más clara y profesional.
  - Instrucciones de instalación y primeros pasos detalladas y secuenciales.
  - Explicación del flujo de registro, activación y asignación de empresas.
  - Sección de solución de problemas frecuentes añadida (errores de clave JWT, empresas no asignadas, Node, proxy, correo de activación).
  - Índice y organización mejorados para facilitar la navegación.
  - Uso de ejemplos, advertencias y consejos prácticos.
  - Mejor presentación visual y ortográfica.
- Se mantiene la estructura principal y las capturas, pero se recomienda revisar imágenes y actualizar si es necesario.

---

## [1.x.x] - Anteriores
- Cambios previos no documentados en este archivo.
