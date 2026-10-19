# Cómo publicar NEXORA MVP 0.1

El MVP es un servidor Node con una base SQLite. Necesita un hosting que ejecute Node 22 (o Docker) y un **disco persistente** para `/data`.
Esta entrega **no está desplegada** (el entorno de desarrollo no tiene salida a internet); estas son las rutas, de la más rápida a la más estable.

## A. Enlace temporal en minutos (sin cuenta, desde tu computadora)
1. Instala [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Ejecuta **`./compartir.sh`** (macOS/Linux) o **doble clic en `COMPARTIR.bat`** (Windows). Inicia el servidor y el túnel juntos.
3. Aparece una URL `https://….trycloudflare.com`: es pública mientras tu computadora y esa ventana sigan abiertas. Compártela.

> ⚠️ Si lo haces a mano, el servidor **debe** arrancar con `TRUST_PROXY=1` (`TRUST_PROXY=1 node apps/mvp/server.mjs`; en Windows, `set TRUST_PROXY=1` antes).
> Sin esa variable, detrás de un enlace HTTPS **todos los formularios (demo, registro, login) responden 403** porque el origen no coincide.
> (Alternativa a cloudflared: `ngrok http 3000`, con la misma variable.)

## B. Render (recomendado para tener un enlace estable)
1. Sube el proyecto a un repositorio de GitHub.
2. En Render: **New → Blueprint** y elige el repositorio (usa `render.yaml`: Docker + disco de 1 GB en `/data`; el disco exige un plan de pago).
3. En las variables de entorno define `APP_URL` con la URL que Render te asigne (p. ej. `https://nexora-mvp.onrender.com`).
4. Render te da el enlace público con HTTPS. Verifica `…/salud` → `{"status":"ok"}`.

## C. Fly.io
`fly launch --no-deploy` → `fly volumes create nexora_data --size 1` → `fly deploy` (usa `fly.toml`). Ajusta `APP_URL`.

## D. VPS propio
`docker build -t nexora-mvp . && docker run -d -p 3000:3000 -v nexora-data:/data -e APP_URL=https://tu-dominio nexora-mvp` detrás de Caddy/Nginx con HTTPS.

## Qué falta para el enlace público (lo que sólo tú puedes aportar)
- Una cuenta en el hosting elegido (Render/Fly/VPS) y un repositorio donde subir el código.
- (Opcional) un dominio propio y su DNS.
- Hasta entonces `SITE_INDEXABLE` queda en `false`: el sitio lleva `noindex` y `robots.txt` bloquea a los buscadores.

## Antes de usarlo con estudiantes reales
- Configurar un proveedor de correo (verificación y recuperación de contraseña).
- Revisión jurídica de privacidad y términos (hoy son borradores).
- Copias de seguridad del volumen `/data` (contiene todas las cuentas).
- Correo oficial de contacto (`CONTACT_EMAIL` y reconstruir el sitio público).
- La imagen Docker y los archivos de Render/Fly **no se pudieron probar aquí** (no hay Docker ni red); el arranque se verificó copiando sólo los archivos que usa el Dockerfile.
