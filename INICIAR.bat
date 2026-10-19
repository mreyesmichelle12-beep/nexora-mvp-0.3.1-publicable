@echo off
cd /d "%~dp0"
echo Iniciando NEXORA MVP... abre http://localhost:3000 en tu navegador
node --no-warnings apps\mvp\server.mjs
pause
