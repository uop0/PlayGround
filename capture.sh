#!/usr/bin/env bash
# Capture desktop + mobile screenshots of the exact CAPTURE_URL into CAPTURE_DIR.
# Leaves the app running; closes only its own browser.
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p bash -c 'if [ -z "${CAPTURE_URL:-}" ] || [ -z "${CAPTURE_DIR:-}" ]; then echo "Set CAPTURE_URL and CAPTURE_DIR." >&2; exit 1; fi'
/usr/bin/time -p mkdir -p "${CAPTURE_DIR:?}"
/usr/bin/time -p echo "Capturing $CAPTURE_URL into $CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
/usr/bin/time -p ls -la "${CAPTURE_DIR:?}"
