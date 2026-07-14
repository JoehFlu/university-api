#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(dirname -- "$SCRIPT_DIR")
BACKUP_FILE=${1:-"castlemock-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"}

case "$BACKUP_FILE" in
  *[!A-Za-z0-9._-]* | "")
    echo "Имя архива может содержать только буквы, цифры, точку, дефис и подчёркивание." >&2
    exit 2
    ;;
esac

case "$BACKUP_FILE" in
  *.tar.gz) ;;
  *) BACKUP_FILE="${BACKUP_FILE}.tar.gz" ;;
esac

cd "$PROJECT_DIR"
mkdir -p backups

CASTLEMOCK_WAS_RUNNING=false
if docker compose ps --status running --services | grep -qx castlemock; then
  CASTLEMOCK_WAS_RUNNING=true
  docker compose stop castlemock
fi

restart_castlemock() {
  if [ "$CASTLEMOCK_WAS_RUNNING" = true ]; then
    docker compose up -d castlemock >/dev/null
  fi
}
trap restart_castlemock EXIT INT TERM

docker compose run --rm --no-deps \
  -e BACKUP_FILE="$BACKUP_FILE" \
  castlemock-init \
  sh -ec '
    test -f /data/.initialized || {
      echo "Рабочее хранилище CastleMock ещё не инициализировано." >&2
      exit 1
    }
    tar -czf "/backups/$BACKUP_FILE" -C /data \
      .initialized \
      rest/application \
      rest/method \
      rest/project \
      rest/resource \
      rest/response \
      user
  '

trap - EXIT INT TERM
restart_castlemock
echo "Резервная копия создана: backups/$BACKUP_FILE"
