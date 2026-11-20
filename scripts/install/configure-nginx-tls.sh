#!/usr/bin/env bash
# Version: 1.0.0
# Configures Nginx reverse proxy, rate-limiting for public QR traceability endpoints,
# and TLS (Let's Encrypt Certbot or internal LAN self-signed certificate).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${SCRIPT_DIR}/templates"

ENV_FILE="/opt/inatrace/.env"
DOMAIN=""
TLS_MODE="letsencrypt"
EMAIL=""
FRONTEND_PORT_ARG=""
KEYCLOAK_PORT_ARG=""
BACKEND_PORT_ARG=""
NGINX_SITE_NAME="inatrace"
SKIP_CERTBOT_OBTAIN="false"

log_info()  { printf '[INFO]  %s\n' "$*"; }
log_ok()    { printf '[OK]    %s\n' "$*"; }
log_warn()  { printf '[WARN]  %s\n' "$*"; }
log_error() { printf '[ERROR] %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
Usage: configure-nginx-tls.sh [OPTIONS]

Installs Nginx rate-limit and reverse-proxy configuration for INATrace with HTTPS TLS.

Options:
  --env-file <path>              Path to INATrace .env file (default: /opt/inatrace/.env)
  --domain <fqdn>                Public or LAN FQDN (overrides DOMAIN_NAME in .env)
  --tls-mode <mode>              TLS mode: letsencrypt | lan-selfsigned (default: letsencrypt)
  --email <email>                Contact email for Let's Encrypt (required for letsencrypt mode)
  --frontend-port <port>         Local frontend container port (overrides FRONTEND_PORT or 8081)
  --keycloak-port <port>         Local Keycloak container port (overrides KEYCLOAK_PORT or 8082)
  --backend-port <port>          Local backend container port (overrides BACKEND_PORT or 8083)
  --nginx-site-name <name>       Nginx site filename without extension (default: inatrace)
  --skip-certbot-obtain          Reuse existing Let's Encrypt cert without running certbot certonly
  -h, --help                     Show this help message and exit

Examples:
  sudo ./configure-nginx-tls.sh --env-file /opt/inatrace/.env --email ops@mi-cooperativa.org
  sudo ./configure-nginx-tls.sh --domain trazabilidad.mi-cooperativa.org --tls-mode lan-selfsigned
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      [[ $# -ge 2 ]] || { log_error "--env-file requires a value"; exit 1; }
      ENV_FILE="$2"
      shift 2
      ;;
    --domain)
      [[ $# -ge 2 ]] || { log_error "--domain requires a value"; exit 1; }
      DOMAIN="$2"
      shift 2
      ;;
    --tls-mode)
      [[ $# -ge 2 ]] || { log_error "--tls-mode requires a value"; exit 1; }
      TLS_MODE="$2"
      shift 2
      ;;
    --email)
      [[ $# -ge 2 ]] || { log_error "--email requires a value"; exit 1; }
      EMAIL="$2"
      shift 2
      ;;
    --frontend-port)
      [[ $# -ge 2 ]] || { log_error "--frontend-port requires a value"; exit 1; }
      FRONTEND_PORT_ARG="$2"
      shift 2
      ;;
    --keycloak-port)
      [[ $# -ge 2 ]] || { log_error "--keycloak-port requires a value"; exit 1; }
      KEYCLOAK_PORT_ARG="$2"
      shift 2
      ;;
    --backend-port)
      [[ $# -ge 2 ]] || { log_error "--backend-port requires a value"; exit 1; }
      BACKEND_PORT_ARG="$2"
      shift 2
      ;;
    --nginx-site-name)
      [[ $# -ge 2 ]] || { log_error "--nginx-site-name requires a value"; exit 1; }
      NGINX_SITE_NAME="$2"
      shift 2
      ;;
    --skip-certbot-obtain)
      SKIP_CERTBOT_OBTAIN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      usage >&2
      exit 1
      ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || { log_error "Must run as root (use sudo)."; exit 1; }
command -v nginx >/dev/null 2>&1 || { log_error "nginx is not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { log_error "python3 is required."; exit 1; }

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

DOMAIN="${DOMAIN:-${DOMAIN_NAME:-}}"
FRONTEND_PORT="${FRONTEND_PORT_ARG:-${FRONTEND_PORT:-8081}}"
KEYCLOAK_PORT="${KEYCLOAK_PORT_ARG:-${KEYCLOAK_PORT:-8082}}"
BACKEND_PORT="${BACKEND_PORT_ARG:-${BACKEND_PORT:-8083}}"

if [[ -z "${DOMAIN}" ]]; then
  log_error "Domain name not specified. Pass --domain <fqdn> or set DOMAIN_NAME in ${ENV_FILE}."
  exit 1
fi

for port_val in "${FRONTEND_PORT}" "${KEYCLOAK_PORT}" "${BACKEND_PORT}"; do
  if ! [[ "${port_val}" =~ ^[0-9]+$ ]]; then
    log_error "Invalid port value: ${port_val}"
    exit 1
  fi
done

case "${TLS_MODE}" in
  letsencrypt)
    SSL_CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    SSL_KEY_PATH="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    if [[ ! -f "${SSL_CERT_PATH}" && "${SKIP_CERTBOT_OBTAIN}" == "false" ]]; then
      command -v certbot >/dev/null 2>&1 || { log_error "certbot is required for --tls-mode letsencrypt"; exit 1; }
      [[ -n "${EMAIL}" ]] || { log_error "--email is required when obtaining a new Let's Encrypt certificate"; exit 1; }
      log_info "Obtaining Let's Encrypt certificate for ${DOMAIN}..."
      systemctl stop nginx || true
      certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        -d "${DOMAIN}"
      log_ok "Let's Encrypt certificate issued at ${SSL_CERT_PATH}"
    else
      log_ok "Using existing Let's Encrypt certificate at ${SSL_CERT_PATH}"
    fi
    ;;
  lan-selfsigned)
    command -v openssl >/dev/null 2>&1 || { log_error "openssl is required for --tls-mode lan-selfsigned"; exit 1; }
    SSL_DIR="/etc/ssl/inatrace"
    SSL_CERT_PATH="${SSL_DIR}/${DOMAIN}.crt"
    SSL_KEY_PATH="${SSL_DIR}/${DOMAIN}.key"
    mkdir -p "${SSL_DIR}"
    if [[ ! -f "${SSL_CERT_PATH}" || ! -f "${SSL_KEY_PATH}" ]]; then
      log_info "Generating 825-day LAN self-signed TLS certificate for ${DOMAIN}..."
      openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
        -keyout "${SSL_KEY_PATH}" \
        -out "${SSL_CERT_PATH}" \
        -subj "/CN=${DOMAIN}" \
        -addext "subjectAltName=DNS:${DOMAIN}"
      chmod 600 "${SSL_KEY_PATH}"
      chmod 644 "${SSL_CERT_PATH}"
      log_ok "Self-signed certificate generated at ${SSL_CERT_PATH}"
    else
      log_ok "Using existing self-signed certificate at ${SSL_CERT_PATH}"
    fi
    ;;
  *)
    log_error "Unsupported --tls-mode: ${TLS_MODE} (use 'letsencrypt' or 'lan-selfsigned')"
    exit 1
    ;;
esac

[[ -f "${TEMPLATE_DIR}/nginx-http-limit_req_zone.conf" ]] || { log_error "Missing template: ${TEMPLATE_DIR}/nginx-http-limit_req_zone.conf"; exit 1; }
[[ -f "${TEMPLATE_DIR}/nginx-inatrace.conf" ]] || { log_error "Missing template: ${TEMPLATE_DIR}/nginx-inatrace.conf"; exit 1; }

install -d -m 755 /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled
install -m 644 "${TEMPLATE_DIR}/nginx-http-limit_req_zone.conf" /etc/nginx/conf.d/inatrace-ratelimit.conf

SITE_AVAIL="/etc/nginx/sites-available/${NGINX_SITE_NAME}.conf"
SITE_ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE_NAME}.conf"

python3 - "${TEMPLATE_DIR}/nginx-inatrace.conf" "${SITE_AVAIL}" \
  "${DOMAIN}" "${FRONTEND_PORT}" "${KEYCLOAK_PORT}" "${BACKEND_PORT}" \
  "${SSL_CERT_PATH}" "${SSL_KEY_PATH}" <<'PY_RENDER'
import sys

src, dst, domain, fe_port, kc_port, be_port, cert_path, key_path = sys.argv[1:]
with open(src, encoding="utf-8") as fh:
    content = fh.read()

replacements = {
    "__DOMAIN_NAME__": domain,
    "__FRONTEND_PORT__": fe_port,
    "__KEYCLOAK_PORT__": kc_port,
    "__BACKEND_PORT__": be_port,
    "__SSL_CERT_PATH__": cert_path,
    "__SSL_KEY_PATH__": key_path,
}
for k, v in replacements.items():
    content = content.replace(k, v)

# Exclude duplicate limit_req_zone if nginx-http-limit_req_zone.conf is installed in conf.d
filtered = [
    line for line in content.splitlines(keepends=True)
    if not line.lstrip().startswith("limit_req_zone ")
]
with open(dst, "w", encoding="utf-8") as fh:
    fh.writelines(filtered)
PY_RENDER

ln -sfn "${SITE_AVAIL}" "${SITE_ENABLED}"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
log_ok "Nginx configured and reloaded for https://${DOMAIN}"
