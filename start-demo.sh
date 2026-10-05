#!/bin/sh
# Start de AVD Velgen demo en open de simulator in de browser (Mac/Linux).
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js is niet gevonden. Installeer het via https://nodejs.org"; exit 1; }
( sleep 1; open "http://localhost:8190/demo/simulator/" 2>/dev/null || xdg-open "http://localhost:8190/demo/simulator/" 2>/dev/null ) &
echo "Server draait op http://localhost:8190/demo/simulator/  (Ctrl+C om te stoppen)"
node serve.mjs
