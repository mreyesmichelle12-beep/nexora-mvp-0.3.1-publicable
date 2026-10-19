#!/bin/sh
# Inicia NEXORA MVP en http://localhost:3000  (macOS / Linux)
cd "$(dirname "$0")" && exec node --no-warnings apps/mvp/server.mjs
