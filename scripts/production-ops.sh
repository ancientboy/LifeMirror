#!/usr/bin/env bash

set -Eeuo pipefail

OPERATION="${1:-diagnose}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/github-runner/lifemirror-production}"
LOG_LINES="${LOG_LINES:-200}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ROLLBACK_API_IMAGE="lifemirror-rollback-api:previous"
ROLLBACK_WEB_IMAGE="lifemirror-rollback-web:previous"
CURRENT_API_IMAGE="lifemirror-production-api:latest"
CURRENT_WEB_IMAGE="lifemirror-production-web:latest"

if [[ "$DEPLOY_DIR" == "/" || -z "$DEPLOY_DIR" ]]; then
  echo "Refusing to operate on an unsafe deployment directory."
  exit 2
fi

case "$LOG_LINES" in
  100|200|400) ;;
  *) echo "LOG_LINES must be 100, 200, or 400."; exit 2 ;;
esac

cd "$DEPLOY_DIR"

if [[ ! -f .env.production || ! -f "$COMPOSE_FILE" ]]; then
  echo "Production configuration is incomplete in $DEPLOY_DIR."
  exit 2
fi

compose() {
  docker compose --env-file .env.production -f "$COMPOSE_FILE" "$@"
}

redact() {
  sed -E \
    -e 's/(Bearer[[:space:]]+)[A-Za-z0-9._~+\/=:-]+/\1[REDACTED]/gI' \
    -e 's/(gsk_|sk-|re_)[A-Za-z0-9_-]{8,}/[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL_REDACTED]/g' \
    -e "s/((api[_-]?key|token|secret|password)[\"'[:space:]]*[:=][\"'[:space:]]*)[^,;\"'}[:space:]]+/\1[REDACTED]/gI"
}

env_has_value() {
  local key="$1"
  awk -v wanted="$key" '
    $0 !~ /^[[:space:]]*#/ {
      line=$0
      sub(/^[[:space:]]*export[[:space:]]+/, "", line)
      split(line, pair, "=")
      name=pair[1]
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", name)
      if (name == wanted) {
        sub(/^[^=]*=/, "", line)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
        gsub(/^\"|\"$/, "", line)
        if (length(line) > 0) found=1
      }
    }
    END { exit(found ? 0 : 1) }
  ' .env.production
}

configuration_report() {
  local missing_critical=0
  local key
  echo "::group::Configuration presence check (values are never printed)"
  for key in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL REFLECTION_TOKEN_SECRET METRICS_TOKEN LLM_API_KEY; do
    if env_has_value "$key"; then
      echo "[ok] $key"
    else
      echo "[missing-critical] $key"
      missing_critical=1
    fi
  done

  for key in RESEND_API_KEY EMAIL_FROM; do
    if env_has_value "$key"; then
      echo "[ok] $key"
    else
      echo "[missing-feature] $key (email login will not work)"
    fi
  done

  if env_has_value VISION_API_KEY || env_has_value LLM_FALLBACK_API_KEY; then
    echo "[ok] vision credential"
  else
    echo "[missing-feature] VISION_API_KEY or LLM_FALLBACK_API_KEY (screenshot recognition will not work)"
  fi
  echo "::endgroup::"
  return "$missing_critical"
}

api_health() {
  compose exec -T api node --input-type=module - <<'NODE'
const paths = ["/health/live", "/health/ready"];
let failed = false;
for (const path of paths) {
  try {
    const response = await fetch(`http://127.0.0.1:8787${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.text();
    console.log(`${path}: HTTP ${response.status} ${body}`);
    if (!response.ok) failed = true;
  } catch (error) {
    console.log(`${path}: ${error instanceof Error ? error.message : "request failed"}`);
    failed = true;
  }
}
if (failed) process.exit(1);
NODE
}

wait_for_api() {
  local attempt
  for attempt in $(seq 1 18); do
    if api_health; then
      return 0
    fi
    echo "API is not ready yet (attempt $attempt/18)."
    sleep 5
  done
  return 1
}

public_health_url() {
  local url
  url="$(awk -F= '$1 == "PUBLIC_HEALTHCHECK_URL" { sub(/^[^=]*=/, ""); gsub(/^[[:space:]\"]+|[[:space:]\"]+$/, ""); print; exit }' .env.production)"
  printf '%s' "${url:-https://beta.lumeword.com/}"
}

origin_health() {
  local url host
  url="$(public_health_url)"
  host="${url#https://}"
  host="${host%%/*}"
  [[ -n "$host" && "$host" != "$url" ]] || return 1
  curl --fail --show-error --silent --max-time 10 \
    --header "Host: $host" \
    --output /dev/null \
    --write-out "Local web origin: %{http_code} in %{time_total}s\n" \
    "http://127.0.0.1/"
}

public_health() {
  local url
  url="$(public_health_url)"
  curl --fail --show-error --silent --location --max-time 20 \
    --output /dev/null \
    --write-out "Public HTTPS: %{http_code} in %{time_total}s\n" \
    "$url"
}

safe_logs() {
  echo "::group::Recent application logs (redacted)"
  compose logs --no-color --tail "$LOG_LINES" api web 2>&1 | redact || true
  echo "::endgroup::"
}

runtime_report() {
  echo "::group::Runtime and capacity"
  docker version --format 'Docker server {{.Server.Version}}'
  compose config --quiet
  compose ps
  df -h "$DEPLOY_DIR"
  free -h || true
  docker system df || true
  echo "::endgroup::"
}

diagnose() {
  local failed=0
  configuration_report || failed=1
  runtime_report || failed=1
  echo "::group::Internal API health"
  api_health || failed=1
  echo "::endgroup::"
  echo "::group::Public web health"
  origin_health || failed=1
  public_health || failed=1
  echo "::endgroup::"
  safe_logs
  return "$failed"
}

backup_current_images() {
  local api_container web_container
  api_container="$(compose ps -q api)"
  web_container="$(compose ps -q web)"
  if [[ -z "$api_container" || -z "$web_container" ]]; then
    echo "A complete running release was not found; preserving any existing rollback images."
    return 0
  fi
  if ! api_health >/dev/null 2>&1 || ! origin_health >/dev/null 2>&1; then
    echo "The current release is not healthy; preserving the last known rollback images."
    return 0
  fi
  if [[ -n "$api_container" ]]; then
    docker tag "$(docker inspect --format '{{.Image}}' "$api_container")" "$ROLLBACK_API_IMAGE"
  fi
  if [[ -n "$web_container" ]]; then
    docker tag "$(docker inspect --format '{{.Image}}' "$web_container")" "$ROLLBACK_WEB_IMAGE"
  fi
}

rollback_available() {
  docker image inspect "$ROLLBACK_API_IMAGE" >/dev/null 2>&1 &&
    docker image inspect "$ROLLBACK_WEB_IMAGE" >/dev/null 2>&1
}

rollback_previous() {
  if ! rollback_available; then
    echo "No verified previous application images are available for rollback."
    return 1
  fi
  docker tag "$ROLLBACK_API_IMAGE" "$CURRENT_API_IMAGE"
  docker tag "$ROLLBACK_WEB_IMAGE" "$CURRENT_WEB_IMAGE"
  compose up -d --no-build --force-recreate api web
  wait_for_api
  origin_health
  public_health || echo "Public HTTPS check failed after rollback; local services are healthy."
  compose ps
}

redeploy_current() {
  backup_current_images
  if compose up -d --build --remove-orphans && wait_for_api && origin_health; then
    public_health || echo "Public HTTPS check failed; deployment is healthy at the local origin."
    compose ps
    return 0
  fi

  echo "Deployment verification failed. Attempting application-image rollback."
  safe_logs
  if rollback_previous; then
    echo "Previous application images were restored. The failed deployment remains marked as failed."
  else
    echo "Automatic rollback was unavailable or unsuccessful."
  fi
  return 1
}

restart_app() {
  compose restart api web
  wait_for_api
  origin_health
  public_health || echo "Public HTTPS check failed after restart; local services are healthy."
  compose ps
}

case "$OPERATION" in
  diagnose) diagnose ;;
  restart_app) restart_app || { safe_logs; exit 1; } ;;
  redeploy_current) redeploy_current ;;
  rollback_previous) rollback_previous || { safe_logs; exit 1; } ;;
  *)
    echo "Unknown operation: $OPERATION"
    echo "Allowed: diagnose, restart_app, redeploy_current, rollback_previous"
    exit 2
    ;;
esac
