# DevOps Agent Context - Arquitectura de Despliegue Frontend

Este documento describe la topología de la infraestructura para el despliegue del Frontend (InaTrace) en el servidor de pre-producción / producción. 

## 1. Topología de Red y Servidores

La arquitectura consta de **dos servidores principales** (o un servidor local + uno remoto):

### Servidor de Jenkins/Pre-producción (Ej: 190.15.143.254)
Este servidor cumple una doble función:
- Aloja el **agente/servidor de Jenkins**.
- Actúa como **ambiente de Staging/Pre-producción** (`testinatrace.espam.edu.ec`).
- **Despliegue:** Jenkins ejecuta comandos de forma **local** usando `docker-compose`.

### Servidor de Producción (Ej: 10.10.102.26)
- Entorno de producción aislado.
- **Despliegue:** Jenkins se conecta hacia este servidor de forma **remota vía SSH** (`scp` y `bash`) para levantar los contenedores de producción.

---

## 2. Flujo del Tráfico Web (Doble Proxy Inverso)

Para manejar las peticiones, existe una estructura de doble Nginx:

### Nginx Nivel 1: Host Nginx (Reverse Proxy)
Ubicado en el sistema operativo host (fuera de los contenedores Docker) en `/etc/nginx/sites-enabled/`. Su única tarea es *enrutar* puertos.

**Reglas de ruteo principales** (Ver `fe/ci/host-nginx.conf`):
- `URL /` → proxy a `127.0.0.1:8081` (Contenedor Frontend).
- `URL /api/` → proxy a `127.0.0.1:8082` (Contenedor Backend).
- `URL /auth/` → proxy a `127.0.0.1:8083` (Contenedor Keycloak).
- `URL /jenkins/` → proxy a `127.0.0.1:8080`.
- `URL /wms/` → proxy a `ide.ambiente.gob.ec:8080`.

### Nginx Nivel 2: Container Nginx (Angular Front)
Ubicado estructurado dentro de la imagen Docker generada del Frontend. Su tarea es alojar los assets pre-compilados y rutear la Single Page Application (SPA).

**Reglas principales** (Ver `fe/ci/nginx.conf`):
- Escucha el puerto interno `80` (que Docker mapea al `8081` del Host).
- Establece estrategias de Caché agresivas para assets.
- Establece `no-cache` para el `index.html` y los asstes dinámicos `env.js`.
- Establece **`try_files $uri $uri/ /index.html`** para delegar el control de rutas al router nativo de Angular, evitando errores 404 al refrescar las pantallas hijas.

---

## 3. Checklist para futuros despliegues

Al momento de realizar modificaciones que afecten el pipeline de CI/CD:
1. **Network**: Asegurar que tanto Frontend como Backend de un mismo entorno comparten nombres de Docker Networks para que exista resolución interna segura de contenedores (Incluso si no la usan primariamente).
2. **Ports**: Verificar que el mapeo coincide con lo que el Nginx del host está esperando (`8081` local y no hard-coded si levantan más de 1 front).
3. **Product Type Variables**: Alinear la inyección de `PRIMARY_PRODUCT_TYPE` (Ej: `COCOA` vs `CACAO`), o bien asegurarnos que el backend o frontend soporten la sintaxis declarada en el `docker-compose.yml`.
4. **Proxy**: Si se agrega un endpoint nuevo como parte de InaTrace, Nginx Host TIENE que incluir el mapeo en `sites-enabled/`. El Nginx de Angular NUNCA se encarga de proxy de APIs hacia afuera.
