#!/usr/bin/env bash
# Brings up a Conduit for Part 2 on http://localhost:3000 with no rate limit: Postgres in Docker, the upstream app from source. Reuses the container, the checkout and node_modules on every call; --prepare does everything but the start.
set -euo pipefail

CONDUIT_DIR="${CONDUIT_DIR:-$HOME/.cache/qa-automation-showcase/conduit}"
REPO="https://github.com/TonyMckes/conduit-realworld-example-app.git"
CONTAINER="conduit-pg"

say() { echo "conduit-local: $*"; }

docker info >/dev/null 2>&1 || { say "Docker is not running: start Docker Desktop or Rancher first"; exit 1; }

if docker start "$CONTAINER" >/dev/null 2>&1; then
  say "Postgres container $CONTAINER reused"
else
  docker run -d --name "$CONTAINER" -e POSTGRES_USER=conduit -e POSTGRES_PASSWORD=conduit \
    -e POSTGRES_DB=conduit -p 5432:5432 postgres:16-alpine >/dev/null
  say "Postgres container $CONTAINER created"
fi
until docker exec "$CONTAINER" pg_isready -U conduit >/dev/null 2>&1; do sleep 1; done

if [ -d "$CONDUIT_DIR/.git" ]; then
  say "app checkout reused at $CONDUIT_DIR"
else
  mkdir -p "$(dirname "$CONDUIT_DIR")"
  git clone -q --depth 1 "$REPO" "$CONDUIT_DIR"
  say "app cloned to $CONDUIT_DIR"
fi

# No DEV_DB_LOGGING line: a string there breaks Sequelize's sync and no table is created.
printf 'PORT=3001\nJWT_KEY=qa-automation-showcase-local\nDEV_DB_USERNAME=conduit\nDEV_DB_PASSWORD=conduit\nDEV_DB_NAME=conduit\nDEV_DB_HOSTNAME=127.0.0.1\nDEV_DB_DIALECT=postgres\n' \
  | tee "$CONDUIT_DIR/.env" >"$CONDUIT_DIR/backend/.env"

if [ -d "$CONDUIT_DIR/node_modules" ]; then
  say "app dependencies reused"
else
  npm install --prefix "$CONDUIT_DIR" --no-audit --no-fund >/dev/null
  say "app dependencies installed"
fi

if [ "${1:-}" = "--prepare" ]; then
  say "prepared; start with: npm run conduit:local"
  exit 0
fi

say "starting: web http://localhost:3000, api http://localhost:3001/api; Ctrl+C stops the app, the container stays"
say "then, in another terminal: npm run test:e2e:local, or npm run test:local:ui from e2e-tests/"
exec npm run dev --prefix "$CONDUIT_DIR"
