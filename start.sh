#!/usr/bin/env bash
# FFQPU Box Assist — static preview server.
# Serves PROJECT_DIR/dist in the foreground on PORT (default 3000) and
# records the built directory for the controller.
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p mkdir -p dist "${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p test -f dist/index.html
# Build when needed: refresh dist from web/ source when source is newer.
/usr/bin/time -p bash -c 'if [ -f web/index.html ] && { [ ! -f dist/index.html ] || [ web/index.html -nt dist/index.html ]; }; then cp web/index.html dist/index.html; fi'
# Install dependencies when a package project exists (no-op for this static site).
/usr/bin/time -p bash -c 'if [ -f package.json ]; then if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi; fi'
# Build step for package projects (skipped when no build script).
/usr/bin/time -p bash -c 'if [ -f package.json ] && node -e "process.exit(require(\"./package.json\").scripts&&require(\"./package.json\").scripts.build?0:1)"; then npm run build; fi'
/usr/bin/time -p bash -c 'OUT="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}/deployment-output.json"; PROJ="$(pwd)"; DIR="$PROJ/dist"; printf "{\"project\":\"%s\",\"directory\":\"%s\"}" "$PROJ" "$DIR" > "$OUT"; cat "$OUT"; echo'
PORT="${PORT:-3000}"
/usr/bin/time -p echo "Serving $PWD/dist on port $PORT"
/usr/bin/time -p python3 -m http.server "$PORT" --directory dist
