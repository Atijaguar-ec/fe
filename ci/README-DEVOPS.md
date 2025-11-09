# 🚀 DevOps Configuration - Frontend INATrace

## Cambios Implementados (Profesional)

### ✅ Separación Frontend/Backend
- **Antes**: `docker-compose.yml` usaba imagen backend (`ghcr.io/atijaguar-ec/backend-inatrace`)
- **Ahora**: Usa variables específicas `FE_IMAGE_NAME` y `FE_TAG` para frontend
- **Beneficio**: Elimina dependencias de base de datos y backend en CI

### ✅ Healthcheck Optimizado
- **Antes**: `curl -f http://localhost/health` (endpoint backend inexistente)
- **Ahora**: `curl -f http://localhost` (archivo estático index.html)
- **Beneficio**: Respuesta inmediata, sin dependencias externas

### ✅ Variables de Entorno Limpias
```bash
# Frontend específico
FE_IMAGE_NAME=ghcr.io/atijaguar-ec/fe-inatrace
FE_TAG=test-5054e7eb
CONTAINER_NAME=inatrace-fe-test-unocace
HOST_HTTP_PORT=8081

# Healthcheck optimizado para CI
HEALTHCHECK_URL=http://localhost
HEALTHCHECK_INTERVAL=15s
HEALTHCHECK_TIMEOUT=5s
HEALTHCHECK_RETRIES=3
HEALTHCHECK_START_PERIOD=10s
```

### ✅ Jenkinsfile Actualizado
- Usa `.env.frontend` específico en lugar del `.env` mixto
- Variables dinámicas actualizadas por build (`FE_TAG`, `CONTAINER_NAME`)
- Healthcheck apunta a archivos estáticos, no endpoints backend
- Separación clara entre staging (local) y production (remoto)

## Archivos Modificados

### 1. `ci/docker-compose.yml`
```yaml
services:
  inatrace-frontend:
    image: ${FE_IMAGE_NAME:-ghcr.io/atijaguar-ec/fe-inatrace}:${FE_TAG:-latest}
    # Eliminadas: env_file, environment (backend vars)
    # Solo: networks frontend, healthcheck estático
```

### 2. `ci/.env.frontend` (nuevo)
- Variables específicas de frontend
- Sin credenciales de base de datos
- Healthcheck optimizado para CI/CD

### 3. `ci/Jenkinsfile`
- Variables `FE_IMAGE_NAME`/`FE_TAG` en lugar de `IMAGE_NAME`/`TAG`
- Healthcheck a `http://localhost` (estático)
- Uso de `.env.frontend` con actualizaciones dinámicas

## Flujo de Despliegue

### Staging (Branch: staging)
1. **Build**: Crea imagen `ghcr.io/atijaguar-ec/fe-inatrace:test-{commit}`
2. **Deploy Local**: Usa `ci/.env.frontend` + variables dinámicas
3. **Healthcheck**: `curl http://localhost:8081` (archivo estático)
4. **Resultado**: Frontend funcionando sin backend

### Production (Branch: main)
1. **Build**: Crea imagen `ghcr.io/atijaguar-ec/fe-inatrace:latest`
2. **Deploy Remoto**: SSH al servidor, docker-compose up
3. **Healthcheck**: `curl http://localhost` en servidor remoto
4. **Resultado**: Frontend en producción

## Ventajas DevOps

### 🎯 Separación de Responsabilidades
- Frontend CI independiente del backend
- Sin dependencias de base de datos en tests
- Fallos aislados (frontend no afecta backend)

### ⚡ Pipeline Más Rápido
- Healthcheck inmediato (archivos estáticos)
- Sin esperas de conexión DB
- Menos puntos de falla

### 🔧 Mantenimiento Simplificado
- Variables claras y específicas
- Configuración por ambiente
- Logs más claros y específicos

### 🛡️ Seguridad Mejorada
- Sin credenciales DB en frontend CI
- Separación de secrets por componente
- Menor superficie de ataque

## Comandos de Troubleshooting

### Verificar Imagen Frontend
```bash
docker images | grep fe-inatrace
docker run --rm -p 8081:80 ghcr.io/atijaguar-ec/fe-inatrace:test-5054e7eb
curl http://localhost:8081
```

### Verificar Healthcheck
```bash
# Debe devolver 200 y HTML
curl -I http://localhost:8081
curl http://localhost:8081 | head -10
```

### Debug Docker Compose
```bash
cd ci/
docker-compose config  # Verificar variables
docker-compose up      # Ver logs en tiempo real
docker-compose ps      # Estado de contenedores
```

## Próximos Pasos

1. **✅ Completado**: Separación frontend/backend
2. **✅ Completado**: Healthcheck optimizado  
3. **✅ Completado**: Variables específicas
4. **🔄 Pendiente**: Agregar `map.overlay.maeDeforestation` a `es.json`
5. **🔄 Pendiente**: Probar WMS overlay con proxy Nginx
6. **🔄 Pendiente**: Validar i18n cookies.cookiePage

---
**Configurado por**: DevOps Team  
**Fecha**: 2025-11-09  
**Versión**: 1.0 (Profesional)
