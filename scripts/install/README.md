# INATrace Frontend Installation Scripts (`v1.0.0`)

Standardized, idempotent shell scripts for building the Angular frontend container, installing the institutional Keycloak login theme, and configuring Nginx reverse proxy with TLS.

> For the host bootstrap, Docker Compose orchestration, Keycloak realm bootstrap, first administrator setup, cacao profile configuration, ERP provisioning, and backup/restore scripts, see `scripts/install/` in the INATrace Backend repository.

## Contents

| File | Responsibility | Default Parameters |
| :--- | :--- | :--- |
| `build-frontend.sh` | Provision optional 4 GB swapfile and build `inatrace-fe` Docker image (`--push` optional) | `--image-prefix mi-organizacion --tag v1.0.0 --swap-gb 4` |
| `install-keycloak-theme.sh` | Install institutional Keycloak 26 `inatrace` login theme | `--target-dir /opt/inatrace/keycloak-theme/inatrace` |
| `configure-nginx-tls.sh` | Configure Nginx rate-limiting (`/api/public/`) + reverse proxy (`/auth/`, `/api/`, `/`) + TLS (`letsencrypt` or `lan-selfsigned`) | `--env-file /opt/inatrace/.env --tls-mode letsencrypt` |
| `templates/nginx-inatrace.conf` | Parameterized Nginx virtual host template | `__DOMAIN_NAME__`, `__FRONTEND_PORT__`, `__KEYCLOAK_PORT__`, `__BACKEND_PORT__` |
| `templates/nginx-http-limit_req_zone.conf` | Shared `inatrace_public` rate-limit zone (`20r/m`) | Deployed to `/etc/nginx/conf.d/inatrace-ratelimit.conf` |
| `templates/keycloak-theme/inatrace/` | Institutional Keycloak FreeMarker + CSS theme | — |

## Quick Usage

Every script supports `--help` (`-h`) before making changes:

```bash
./scripts/install/build-frontend.sh --help
./scripts/install/install-keycloak-theme.sh --help
./scripts/install/configure-nginx-tls.sh --help
```

### Standard Execution Order (Frontend Responsibilities)

1. Build the frontend Docker image (with host swap safety check on 4 GB VMs):
   ```bash
   sudo ./scripts/install/build-frontend.sh --image-prefix my-org --tag v1.0.0
   ```
2. Install the Keycloak login theme into the shared deployment folder before starting Compose:
   ```bash
   sudo ./scripts/install/install-keycloak-theme.sh --target-dir /opt/inatrace/keycloak-theme/inatrace
   ```
3. Configure Nginx reverse proxy and TLS once the `.env` file has been initialized:
   ```bash
   sudo ./scripts/install/configure-nginx-tls.sh \
     --env-file /opt/inatrace/.env \
     --tls-mode letsencrypt \
     --email ops@mi-cooperativa.org
   ```
   For isolated local networks without public DNS, pass `--tls-mode lan-selfsigned`.
