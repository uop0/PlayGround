#!/usr/bin/env bash
# BlackScript | @FFQPU (Python Flask) — project start script.
# - Installs dependencies, builds a static snapshot into PROJECT_DIR/dist,
#   writes OPENCODE_WEB_DIR/deployment-output.json, then serves Flask in the
#   foreground on PORT (default 3000).
set -euo pipefail
cd "$(dirname "$0")"

: "${PORT:=3000}"
export PORT
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

/usr/bin/time -p pip install --quiet -r requirements.txt

/usr/bin/time -p python3 - <<'PYEOF'
import pathlib
import shutil
from flask import render_template
from app import app, TOOLS

root = pathlib.Path(".").resolve()
dist = root / "dist"
shutil.rmtree(dist, ignore_errors=True)
(dist / "tools").mkdir(parents=True)
client = app.test_client()

pages = [("/", dist / "index.html")]
for tool in TOOLS:
    slug = tool["slug"]
    pages.append(("/tools/" + slug, dist / "tools" / slug / "index.html"))
    pages.append(("/tools/" + slug, dist / "tools" / (slug + ".html")))
for route, path in pages:
    response = client.get(route)
    assert response.status_code == 200, (route, response.status_code)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(response.get_data(as_text=True), encoding="utf-8")

with app.test_request_context("/missing"):
    (dist / "404.html").write_text(render_template("404.html"), encoding="utf-8")
shutil.copytree(root / "static", dist / "static", dirs_exist_ok=True)
assert (dist / "index.html").exists()
print("static snapshot built:", dist)
PYEOF

/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p python3 -c "import json,pathlib; d=pathlib.Path('.').resolve()/'dist'; json.dump({'project':str(pathlib.Path('.').resolve()),'directory':str(d)}, open('$WEB_DIR/deployment-output.json','w')); print(open('$WEB_DIR/deployment-output.json').read())"

# Foreground server (timing a never-returning exec is meaningless, so no time prefix here).
exec python3 app.py
