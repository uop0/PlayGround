#!/usr/bin/env bash
# BlackScript capture script.
# Opens exactly $CAPTURE_URL, waits for rendered content, saves desktop and
# mobile screenshots as final-desktop.png / final-mobile.png in $CAPTURE_DIR,
# closes its own browser, and leaves the app server running.
# Exit 75 = temporary navigation/browser infrastructure failure.
# Exit  1 = script usage error or rendering defect.
set -euo pipefail
cd "$(dirname "$0")"

if [[ -z "${CAPTURE_URL:-}" ]]; then
  echo "capture.sh: CAPTURE_URL is not set." >&2
  exit 1
fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then
  echo "capture.sh: CAPTURE_DIR is not set." >&2
  exit 1
fi
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
