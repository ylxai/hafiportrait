#!/usr/bin/env bash
set -euo pipefail

# Hafiportrait PM2 control helper
# Usage:
#   bash scripts/pm2-control.sh
#
# Requirements:
#   - pm2 installed and available in PATH
#   - process names: main, socket

MAIN_NAME=${PM2_MAIN_NAME:-main}
SOCKET_NAME=${PM2_SOCKET_NAME:-socket}

require_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "pm2 not found in PATH" >&2
    exit 1
  fi
}

pm2_exists() {
  local name="$1"
  pm2 jlist | node -e "
    const fs=require('fs');
    const input=fs.readFileSync(0,'utf8');
    const list=JSON.parse(input||'[]');
    process.exit(list.some(p=>p.name==='${name}') ? 0 : 1);
  "
}

run_pm2() {
  local cmd="$1"; shift
  echo "> pm2 ${cmd} $*"
  pm2 "${cmd}" "$@"
}

op_status() {
  run_pm2 list
}

op_logs() {
  local target="$1"
  local lines="${2:-100}"

  case "$target" in
    main) run_pm2 logs "$MAIN_NAME" --lines "$lines" ;;
    socket) run_pm2 logs "$SOCKET_NAME" --lines "$lines" ;;
    both)
      echo "--- logs: ${MAIN_NAME} (last ${lines}) ---"
      pm2 logs "$MAIN_NAME" --lines "$lines"
      echo "--- logs: ${SOCKET_NAME} (last ${lines}) ---"
      pm2 logs "$SOCKET_NAME" --lines "$lines"
      ;;
    *)
      echo "Unknown target: $target" >&2
      exit 1
      ;;
  esac
}

op_start() {
  local target="$1"
  case "$target" in
    main) run_pm2 start "$MAIN_NAME" ;;
    socket) run_pm2 start "$SOCKET_NAME" ;;
    both)
      run_pm2 start "$SOCKET_NAME"
      run_pm2 start "$MAIN_NAME"
      ;;
    *) echo "Unknown target" >&2; exit 1 ;;
  esac
}

op_stop() {
  local target="$1"
  case "$target" in
    main) run_pm2 stop "$MAIN_NAME" ;;
    socket) run_pm2 stop "$SOCKET_NAME" ;;
    both)
      run_pm2 stop "$MAIN_NAME"
      run_pm2 stop "$SOCKET_NAME"
      ;;
    *) echo "Unknown target" >&2; exit 1 ;;
  esac
}

op_restart() {
  local target="$1"
  case "$target" in
    main) run_pm2 restart "$MAIN_NAME" --update-env ;;
    socket) run_pm2 restart "$SOCKET_NAME" --update-env ;;
    both)
      run_pm2 restart "$SOCKET_NAME" --update-env
      run_pm2 restart "$MAIN_NAME" --update-env
      ;;
    *) echo "Unknown target" >&2; exit 1 ;;
  esac
}

op_restart_safe() {
  # Preferred order for this project: restart socket first, then main.
  run_pm2 restart "$SOCKET_NAME" --update-env
  run_pm2 restart "$MAIN_NAME" --update-env
}

op_health_check() {
  # You can override these URLs when running the script.
  local base_url=${BASE_URL:-"http://localhost:3000"}
  local socket_url=${SOCKET_URL:-"http://localhost:3001"}

  echo "> Checking web health: ${base_url}/api/health"
  if curl -fsS "${base_url}/api/health" >/dev/null; then
    echo "OK: web /api/health"
  else
    echo "FAIL: web /api/health" >&2
    return 1
  fi

  echo "> Checking socket health: ${socket_url}/health"
  if curl -fsS "${socket_url}/health" >/dev/null; then
    echo "OK: socket /health"
  else
    echo "FAIL: socket /health" >&2
    return 1
  fi
}

op_restart_safe_and_health() {
  op_restart_safe

  # Give services a moment to bind ports, then retry health check.
  local attempts=${HEALTH_ATTEMPTS:-10}
  local delay=${HEALTH_DELAY_SECONDS:-2}

  for ((i=1; i<=attempts; i++)); do
    echo "> Health check attempt ${i}/${attempts}"
    if op_health_check; then
      return 0
    fi
    sleep "$delay"
  done

  echo "Health check failed after ${attempts} attempts" >&2
  return 1
}

op_save() {
  run_pm2 save
}

menu_select_target() {
  echo ""
  echo "Select target:"
  select t in "main" "socket" "both" "cancel"; do
    case "$t" in
      main|socket|both) echo "$t"; return 0 ;;
      cancel) echo "cancel"; return 0 ;;
      *) echo "Invalid choice" ;;
    esac
  done
}

main() {
  require_pm2

  echo "Hafiportrait PM2 Control"
  echo "- main process  : $MAIN_NAME"
  echo "- socket process: $SOCKET_NAME"
  echo "(Override names via PM2_MAIN_NAME / PM2_SOCKET_NAME env vars)"

  while true; do
    echo ""
    echo "Choose operation:"
    select op in "status" "start" "stop" "restart" "restart-safe" "restart-safe+health" "health-check" "logs" "save" "quit"; do
      case "$op" in
        status)
          op_status
          break
          ;;
        start)
          target=$(menu_select_target)
          [[ "$target" == "cancel" ]] && break
          op_start "$target"
          break
          ;;
        stop)
          target=$(menu_select_target)
          [[ "$target" == "cancel" ]] && break
          op_stop "$target"
          break
          ;;
        restart)
          target=$(menu_select_target)
          [[ "$target" == "cancel" ]] && break
          op_restart "$target"
          break
          ;;
        restart-safe)
          op_restart_safe
          break
          ;;
        restart-safe+health)
          op_restart_safe_and_health || true
          break
          ;;
        health-check)
          op_health_check || true
          break
          ;;
        logs)
          target=$(menu_select_target)
          [[ "$target" == "cancel" ]] && break
          read -r -p "Lines (default 100): " lines
          lines=${lines:-100}
          op_logs "$target" "$lines"
          break
          ;;
        save)
          op_save
          break
          ;;
        quit)
          echo "Bye."
          return 0
          ;;
        *)
          echo "Invalid choice"
          ;;
      esac
    done
  done
}

main "$@"
