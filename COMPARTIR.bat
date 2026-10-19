@echo off
cd /d "%~dp0"
where cloudflared >nul 2>nul || (echo Falta cloudflared. Instalalo desde https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ & pause & exit /b 1)
set TRUST_PROXY=1
start "NEXORA servidor" /min node --no-warnings apps\mvp\server.mjs
timeout /t 3 >nul
echo Tu enlace publico aparecera abajo como https://....trycloudflare.com ^(deja esta ventana abierta^)
cloudflared tunnel --url http://localhost:3000
