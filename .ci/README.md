# FE CI/CD: Docker Compose (Producción y Dev)

Este directorio contiene la configuración usada por CI/CD para desplegar el frontend.

## Producción (TLS en Nginx del host)
- Archivo activo: `docker-compose.yml`
  - El Nginx del host termina TLS y enruta:
    - `/` -> contenedor FE en puerto 8081 del host
    - `/api/` -> backend (puerto 8080 / red backend)
  - Comando en servidor:
    - `docker compose --env-file .ci/.env -f .ci/docker-compose.yml up -d --force-recreate --remove-orphans`

## Obsoleto (ya no usado por CI/CD)
- `docker-compose.https.yml`
  - Usaba `nginx-proxy` + `acme-companion` dentro de Docker para TLS.
  - Puede eliminarse si migraste TLS al Nginx del host.

## Desarrollo local
- `fe/docker-compose.yml` (raíz del FE): solo si deseas levantar el FE sin HTTPS localmente.
- También existía `fe/.ci/docker-compose.yml` (antes dev), ahora es producción.

## Variables de entorno para producción
Las inyecta el workflow en el servidor (no se versionan aquí):
- IMAGE_NAME: `ghcr.io/<org>/<repo>-frontend`
- TAG: `latest` (se etiqueta localmente en el servidor con el digest exacto)
- FRONTEND_DOMAIN: `inatrace.atijaguar.com`

Archivo de ejemplo: `.ci/.env.example`. El real `.ci/.env` está ignorado (`.gitignore`).

## Notas
- No comprometas secretos en el repo. Usa GitHub Secrets.
- Endpoint de health del FE: `/health`.
