#!/bin/sh
# Comparte NEXORA MVP con un enlace público TEMPORAL (macOS / Linux). Requiere cloudflared instalado.
# Mientras este script esté abierto, cualquiera con el enlace https://....trycloudflare.com puede usar la web.
cd "$(dirname "$0")"
command -v cloudflared >/dev/null 2>&1 || { echo "Falta cloudflared. Instálalo desde https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ y vuelve a ejecutar."; exit 1; }
export TRUST_PROXY=1   # imprescindible detrás del túnel HTTPS: sin esto los formularios devuelven 403
node --no-warnings apps/mvp/server.mjs &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM
sleep 2
echo "Buscando tu enlace público (aparece abajo como https://....trycloudflare.com)..."
cloudflared tunnel --url http://localhost:3000
