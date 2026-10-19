# NEXORA MVP 0.3

Primera versión **ejecutable** de NEXORA: el sitio público completo más una primera experiencia funcional de estudiante.
Corre con **Node ≥ 22.18 y nada más** (sin `npm install`): SQLite y TypeScript "sin compilar" vienen incluidos en Node.

## Abrirlo en tu computadora

```bash
node apps/mvp/server.mjs          # o:  npm run mvp   · en Windows: doble clic en INICIAR.bat · macOS/Linux: ./iniciar.sh
# → http://localhost:3000
```

Verás el sitio público; desde ahí: **Probar demo** (sin cuenta), **Registrarme** o **Iniciar sesión**.
Los datos se guardan en `apps/mvp/data/nexora.db` (se crea solo). Para empezar de cero, borra esa carpeta.

Para compartirlo con un enlace público temporal: `./compartir.sh` / `COMPARTIR.bat` (ver `docs/DEPLOY.md`; exige `TRUST_PROXY=1`).

Variables opcionales: `PORT` (3000) · `APP_URL` (URL pública, para enlaces canónicos) · `DATA_DIR` · `TRUST_PROXY=1` (detrás de un proxy/hosting) ·
`DEMO_ENABLED=false` · `COOKIE_SECURE` (automático según `APP_URL`).

## Qué es REAL en esta versión

| Función | Estado |
|---|---|
| Sitio público (17 páginas, SEO, cookies, contacto) | ✅ Real. Es el sitio de `apps/web`, pre-renderizado |
| Formulario de contacto | ✅ Real: validación, anti-spam, límite de envíos, guarda en SQLite |
| Registro e inicio de sesión de estudiantes | ✅ Real: scrypt, sesiones revocables, límite de intentos |
| Perfil, materias, horarios disponibles | ✅ Real, en SQLite |
| Smart Match por materias y horarios reales | ✅ Real (algoritmo ponderado `mvp-0.1`, **no es IA**) |
| Modo demo con perfiles ficticios separados | ✅ Real: 12 perfiles `is_demo`, nunca mezclados con usuarios reales |
| **Conexiones**: enviar, aceptar, rechazar, cancelar, eliminar, bloquear, desbloquear y reportar | ✅ Real |
| **Mensajería** entre conexiones: hora, "visto", sin leer, anti-spam y límite de velocidad | ✅ Real (se actualiza con "Actualizar"; el tiempo real llega con su servicio) |
| **Progreso**: objetivos, historial de sesiones, gráfica semanal y racha (opcional) | ✅ Real |
| **Temporizador de estudio** (25 / 50 / personalizado, pausa, reanudar, sobrevive a recargar) | ✅ Real; el tiempo es **autodeclarado** |
| **Calendario** mensual, semanal y diario: eventos, objetivos con fecha y sesiones (hora de El Salvador) | ✅ Real |
| Exportar y eliminar mi cuenta (incluye progreso, calendario, conexiones y mensajes enviados) | ✅ Real |

## Qué NO está en esta versión (no se simula)

Verificación de correo (falta proveedor de correo: las cuentas quedan **sin verificar**, y se indica) · Google OAuth · registro de docentes/mentores ·
biblioteca · Study Rooms/video/pizarra · NEXORA AI · pagos · panel admin (los reportes se guardan, pero aún no hay panel para revisarlos).
En la app aparecen como **"Próximamente"**, deshabilitadas.

## Decisiones propias del MVP (ver `docs/DECISIONS.md`)

- **Catálogo de materias:** como aún no existe el catálogo oficial de la UDB (y no se inventa), las materias se escriben libremente y se **normalizan**
  ("Cálculo II" = "calculo ii") para coincidir entre estudiantes. El panel admin las curará en una fase posterior.
- **Sin contraseña para demo:** las cuentas demo no tienen contraseña, no pueden iniciar sesión por formulario y se borran a las 24 h.
- **Un solo proceso:** el límite de intentos vive en memoria. Con varias instancias hará falta Redis (ya contemplado en la arquitectura final).

## Progreso y calendario: lo que conviene saber
- Las sesiones las **declara la persona** (temporizador o registro manual): no se verifica que realmente estudió. Máximo 180 min por sesión y 20 por hora.
- No hay recordatorios ni notificaciones todavía; la racha se puede ocultar. Los días se cuentan en hora de El Salvador (sin horario de verano).
- El calendario aún no incluye clases de docentes ni Study Rooms (llegan con esas fases).

## Reglas de conexiones y mensajes
- Solo se escribe a **conexiones aceptadas** y sin bloqueo; solo los dos participantes ven una conversación (el resto recibe 404).
- Quien es **rechazado** sigue viendo "Solicitud enviada" (no se le revela) y no puede reintentar durante 30 días.
- **Bloquear** elimina la conexión y la conversación completa, y se ocultan mutuamente en Smart Match. **Eliminar una conexión** también borra la conversación.
- Si una cuenta se elimina, desaparecen sus conexiones, bloqueos y conversaciones (incluidos los mensajes que la otra persona tenía con ella).
- En la **demo**, los perfiles ficticios no responden ni se simulan respuestas; no se puede conectar con usuarios reales.

## Reconstruir el sitio público (solo si cambias `apps/web`)

`npm run mvp:build` (requiere `esbuild`, `react`, `react-dom` y `react-icons` instalados: `npm i -D` en `apps/mvp`).
El resultado queda en `apps/mvp/public/` y **está incluido ya construido**, por eso ejecutar el MVP no requiere instalar nada.

## Pruebas

`npm test` (97 pruebas unitarias, sin dependencias) y `npm run mvp:e2e` (155 comprobaciones de extremo a extremo en Chromium; requiere `playwright`).
