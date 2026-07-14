#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(dirname -- "$SCRIPT_DIR")
RESTORE_SOURCE=${1:-reference}

if [ "$RESTORE_SOURCE" = reference ]; then
  RESTORE_FILE=""
  RESTORE_LABEL="эталонное состояние из репозитория"
else
  RESTORE_FILE=$(basename -- "$RESTORE_SOURCE")
  case "$RESTORE_FILE" in
    *[!A-Za-z0-9._-]* | "")
      echo "Некорректное имя резервной копии." >&2
      exit 2
      ;;
  esac
  RESTORE_LABEL="архив backups/$RESTORE_FILE"
fi

cd "$PROJECT_DIR"
mkdir -p backups

if [ -n "$RESTORE_FILE" ]; then
  if [ ! -f "backups/$RESTORE_FILE" ]; then
    echo "Архив backups/$RESTORE_FILE не найден." >&2
    exit 1
  fi
else
  for directory in application method project resource response; do
    if [ ! -d "castlemock_reference/rest/$directory" ]; then
      echo "Эталон CastleMock неполон: отсутствует rest/$directory." >&2
      exit 1
    fi
  done
  if [ ! -d castlemock_reference/user ]; then
    echo "Эталон CastleMock неполон: отсутствует каталог user." >&2
    exit 1
  fi
fi

echo "CastleMock будет восстановлен из источника: $RESTORE_LABEL"
docker compose stop castlemock

docker compose run --rm --no-deps \
  -e RESTORE_FILE="$RESTORE_FILE" \
  castlemock-init \
  sh -ec '
    rm -rf /tmp/castlemock-restore
    mkdir -p /tmp/castlemock-restore

    if [ -n "$RESTORE_FILE" ]; then
      test -f "/backups/$RESTORE_FILE"
      tar -xzf "/backups/$RESTORE_FILE" -C /tmp/castlemock-restore
    else
      mkdir -p /tmp/castlemock-restore/rest /tmp/castlemock-restore/logs
      for directory in application method project resource response; do
        test -d "/reference/rest/$directory"
        cp -a "/reference/rest/$directory" /tmp/castlemock-restore/rest/
      done
      test -d /reference/user
      cp -a /reference/user /tmp/castlemock-restore/user
      mkdir -p /tmp/castlemock-restore/rest/event/v1
    fi

    test -f /tmp/castlemock-restore/rest/project/v2/QXcx23.prj
    touch /tmp/castlemock-restore/.initialized

    find /data -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a /tmp/castlemock-restore/. /data/
  '

docker compose up -d --force-recreate castlemock

attempt=0
while [ "$attempt" -lt 30 ]; do
  health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' castlemock 2>/dev/null || true)
  if [ "$health" = healthy ]; then
    echo "CastleMock восстановлен и готов к работе."
    exit 0
  fi
  if [ "$health" = unhealthy ]; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done

echo "CastleMock не прошёл health check после восстановления." >&2
docker compose logs --tail=50 castlemock >&2
exit 1
