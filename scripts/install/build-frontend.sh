#!/usr/bin/env bash
# Version: 1.0.0
# Builds the INATrace Angular frontend Docker image (optionally provisioning host swap
# for 4 GB RAM VMs and pushing to a container registry).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

IMAGE_PREFIX="${IMAGE_PREFIX:-mi-organizacion}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"
SWAP_GB="4"
NO_SWAP="false"
PUSH="false"

log_info()  { printf '[INFO]  %s\n' "$*"; }
log_ok()    { printf '[OK]    %s\n' "$*"; }
log_warn()  { printf '[WARN]  %s\n' "$*"; }
log_error() { printf '[ERROR] %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
Usage: build-frontend.sh [OPTIONS]

Builds the INATrace Angular frontend Docker image from the repository root.

Options:
  --image-prefix <prefix>  Container registry/namespace prefix (default: mi-organizacion)
  --tag <tag>              Docker image tag (default: v1.0.0)
  --swap-gb <N>            Ensure at least N GB of swap before building Angular (default: 4)
  --no-swap                Skip swap creation even if host RAM + swap is low
  --push                   Push built image to container registry after build
  -h, --help               Show this help message and exit

Examples:
  ./build-frontend.sh --image-prefix my-org --tag v1.0.0
  ./build-frontend.sh --image-prefix registry.example.org/inatrace --tag v1.0.0 --push
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image-prefix)
      [[ $# -ge 2 ]] || { log_error "--image-prefix requires a value"; exit 1; }
      IMAGE_PREFIX="$2"
      shift 2
      ;;
    --tag)
      [[ $# -ge 2 ]] || { log_error "--tag requires a value"; exit 1; }
      IMAGE_TAG="$2"
      shift 2
      ;;
    --swap-gb)
      [[ $# -ge 2 ]] || { log_error "--swap-gb requires a numeric value"; exit 1; }
      SWAP_GB="$2"
      shift 2
      ;;
    --no-swap)
      NO_SWAP="true"
      shift
      ;;
    --push)
      PUSH="true"
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

command -v docker >/dev/null 2>&1 || { log_error "docker CLI is required"; exit 1; }
[[ -f "${REPO_ROOT}/Dockerfile" ]] || { log_error "Dockerfile not found in ${REPO_ROOT}"; exit 1; }

ensure_swap() {
  local swap_gb="$1"
  [[ "${NO_SWAP}" == "true" || "${swap_gb}" == "0" ]] && return 0
  if ! [[ "${swap_gb}" =~ ^[0-9]+$ ]]; then
    log_error "--swap-gb must be a non-negative integer (got: ${swap_gb})"
    exit 1
  fi
  if [[ "$(uname -s)" != "Linux" ]]; then
    log_warn "Skipping host swap setup on non-Linux OS ($(uname -s))."
    return 0
  fi

  local current_swap_kb min_swap_kb
  current_swap_kb="$(awk '/SwapTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  min_swap_kb="$(( swap_gb * 1024 * 1024 * 90 / 100 ))"
  if [[ "${current_swap_kb}" -ge "${min_swap_kb}" ]]; then
    log_ok "Sufficient swap already active (${current_swap_kb} kB)."
    return 0
  fi

  if [[ "$(id -u)" -ne 0 ]]; then
    log_warn "Insufficient swap (${current_swap_kb} kB) and not running as root; skipping /swapfile creation. Re-run with sudo or pass --no-swap."
    return 0
  fi

  if [[ ! -f /swapfile ]]; then
    log_info "Provisioning ${swap_gb}G swapfile at /swapfile for Angular production build..."
    fallocate -l "${swap_gb}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count="$(( swap_gb * 1024 ))" status=progress
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile 2>/dev/null || true
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
  fi
  log_ok "Swap active at /swapfile (${swap_gb}G)."
}

ensure_swap "${SWAP_GB}"

FULL_IMAGE="${IMAGE_PREFIX}/inatrace-fe:${IMAGE_TAG}"
log_info "Building frontend Docker image: ${FULL_IMAGE}"
docker build -t "${FULL_IMAGE}" "${REPO_ROOT}"
log_ok "Frontend image built: ${FULL_IMAGE}"

if [[ "${PUSH}" == "true" ]]; then
  log_info "Pushing image: ${FULL_IMAGE}"
  docker push "${FULL_IMAGE}"
  log_ok "Frontend image pushed: ${FULL_IMAGE}"
fi
