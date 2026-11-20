#!/usr/bin/env bash
# Version: 1.0.0
# Installs the institutional INATrace Keycloak login theme into the target deployment directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_THEME_DIR="${SCRIPT_DIR}/templates/keycloak-theme/inatrace"
TARGET_DIR="/opt/inatrace/keycloak-theme/inatrace"
ENV_FILE=""

log_info()  { printf '[INFO]  %s\n' "$*"; }
log_ok()    { printf '[OK]    %s\n' "$*"; }
log_error() { printf '[ERROR] %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
Usage: install-keycloak-theme.sh [OPTIONS]

Copies the INATrace Keycloak 26 login theme templates and assets to the deployment volume.

Options:
  --target-dir <path>  Destination directory (default: /opt/inatrace/keycloak-theme/inatrace)
  --env-file <path>    Optional .env file to resolve BASE_DIR when --target-dir is omitted
  -h, --help           Show this help message and exit

Examples:
  sudo ./install-keycloak-theme.sh
  sudo ./install-keycloak-theme.sh --target-dir /opt/inatrace/keycloak-theme/inatrace
EOF
}

TARGET_SET="false"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-dir)
      [[ $# -ge 2 ]] || { log_error "--target-dir requires a value"; exit 1; }
      TARGET_DIR="$2"
      TARGET_SET="true"
      shift 2
      ;;
    --env-file)
      [[ $# -ge 2 ]] || { log_error "--env-file requires a value"; exit 1; }
      ENV_FILE="$2"
      shift 2
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

if [[ "${TARGET_SET}" == "false" && -n "${ENV_FILE}" && -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
  if [[ -n "${BASE_DIR:-}" ]]; then
    TARGET_DIR="${BASE_DIR}/keycloak-theme/inatrace"
  fi
fi

[[ -d "${SOURCE_THEME_DIR}" ]] || { log_error "Theme source not found: ${SOURCE_THEME_DIR}"; exit 1; }
[[ -f "${SOURCE_THEME_DIR}/login/theme.properties" ]] || { log_error "Invalid theme: missing login/theme.properties"; exit 1; }

if [[ "$(id -u)" -ne 0 && ! -w "$(dirname "${TARGET_DIR}")" ]]; then
  log_error "Insufficient permissions to write to ${TARGET_DIR}. Run with sudo."
  exit 1
fi

mkdir -p "${TARGET_DIR}"
cp -R "${SOURCE_THEME_DIR}/." "${TARGET_DIR}/"
find "${TARGET_DIR}" -name ".DS_Store" -delete
chmod -R a+rX "${TARGET_DIR}"

[[ -f "${TARGET_DIR}/login/theme.properties" ]] || { log_error "Theme verification failed after copy"; exit 1; }
log_ok "Keycloak theme installed at ${TARGET_DIR}"
