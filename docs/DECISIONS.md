# Decisiones técnicas

## Monolito modular en lugar de microservicios
Un equipo pequeño no debería operar varios servicios desde el día uno. La lógica de negocio vive en `src/services/`
(desde la Fase 4) y puede extraerse después. Alternativa descartada: NestJS aparte (más robusto, más costo operativo).

## Sesiones propias, no JWT
Auth.js con credenciales obliga a JWT, que no se puede revocar al instante. Un bloqueo o suspensión debe cerrar sesiones
YA. Sesión = token aleatorio de 256 bits en cookie `HttpOnly; SameSite=Lax; Secure` (`__Host-` en producción). En BD sólo
se guarda su hash SHA-256. Caducidad por inactividad (14 días) y absoluta (30 días). Google OAuth se añade sobre esto (Fase 4).

## Roles en tabla propia (`user_roles`)
Un docente puede ser también conferencista. Cada rol sensible (MENTOR, TEACHER, CONFERENCE_HOST) sólo tiene efecto con
verificación APROBADA; `effectiveRoles()` lo impone y está probado. Autoasignarse un rol no concede nada.

## Permisos en el servidor
`can(actor, acción, recurso)` es el único punto de decisión. Cubre estado de cuenta, roles vigentes, propiedad del recurso
y actores demo (que nunca acceden a administración).

## Modo demo
- Datos ficticios en BD con `isDemo = true`; el cliente `db` los excluye en lectura y en updateMany/deleteMany.
- Las acciones del visitante en la feria se guardan en una sesión efímera y **no escriben en tablas reales**.
- Sólo `getUnfilteredClient()` ve datos demo (seeds y reinicio del demo).
- En demo, temporizador y pizarra funcionan en modo local; el video usa la cámara del propio visitante; los participantes ficticios se etiquetan como tales.

## CSP con nonce
Se genera un nonce por petición en el middleware. **Costo conocido:** el render pasa a ser dinámico (no estático), lo que
reduce el beneficio de caché en CDN para la web pública. Se revisará en la Fase 14 (alternativa: scripts propios con hashes
en las páginas realmente estáticas). `style-src` permite `'unsafe-inline'` (riesgo bajo; Next inyecta estilos); los scripts no.

## Rate limiting
Ventana fija con almacén intercambiable: memoria (sólo dev/pruebas) y Redis (producción, script Lua atómico).
Límites iniciales en `RULES`; se ajustarán con uso real.

## Estado de pago
Sólo un webhook de Stripe con firma verificada e idempotencia (`webhook_events`) modifica `subscriptions`. Nunca el cliente.

## Contraseñas
argon2id (19 MiB, t=2, p=1; mínimo OWASP). Política NIST: mínimo 10 caracteres, sin composición forzada, bloqueo de
contraseñas comunes y de datos personales. Hash ficticio para igualar tiempos y evitar enumeración de correos.

## Tablas que no se crearon (a propósito)
- `file_categories` → enum `LibraryCategory` (categorías fijas por diseño).
- `file_reports` → tabla genérica `reports` (usuario, mensaje, archivo, sala, conferencia).
- `login_attempts` → contadores en Redis (efímeros).
- `mentors`, `teachers`, `conference_hosts` → roles en `user_roles`; sin tablas por rol.
- Estado de lectura de mensajes → `conversation_members.lastReadAt` en vez de `readAt` por mensaje.
- No se guarda edad ni el historial de conversaciones con la IA (minimización de datos).

## CSS propio en lugar de Tailwind (cambio respecto al stack aprobado)
Tailwind no puede compilarse en el entorno donde se verifica el proyecto (sin red), y sin compilarlo no se puede renderizar
ni auditar la página real (contraste, desbordes, capturas). Los tokens de color y las clases de componente son los mismos;
viven en `src/styles/{tokens,base,ui,pages,site}.css`. Una dependencia menos y cero configuración de build para el estilo.
Volver a Tailwind es una migración mecánica si el equipo lo prefiere.

## MVP 0.1: servidor propio sin dependencias (desvío temporal de la arquitectura final)
El entorno de desarrollo no puede instalar paquetes ni desplegar, así que para tener algo **ejecutable y probado** se creó `apps/mvp`:
Node ≥ 22.18 con `node:sqlite` y TypeScript sin compilar. Reutiliza el sitio público (pre-renderizado desde `apps/web`), el motor de Smart Match
(`packages/match-engine`), el control de acceso, las sesiones, el rate limiting, la validación y la CSP de `apps/web/src/lib`.
La arquitectura final (Next.js + PostgreSQL/Prisma) sigue siendo el destino: el esquema SQLite del MVP es un subconjunto del esquema Prisma
y el acceso a datos está aislado en `apps/mvp/src/db.mjs` para migrarlo.

- **scrypt en vez de argon2id** (módulo nativo de Node, parámetros mínimos OWASP). Al migrar, los hashes se rehacen en el siguiente inicio de sesión.
- **Correo sin verificar:** no hay proveedor de correo; las cuentas se crean activas con `email_verified_at = NULL` y la interfaz lo declara.
- **Catálogo de materias por universidad, libre y normalizado:** no existe catálogo oficial y no se inventa uno. Se cura en el panel admin (fase posterior).
- **Smart Match:** sólo evalúa factores con datos de ambas personas y normaliza; exige al menos una materia o un bloque en común. Habilidades aún no existen.
- **Demo:** perfiles ficticios `is_demo=1` en la misma base, filtrados en toda consulta (demo con demo, real con real); visitantes demo efímeros (borrados al salir o a las 24 h).
- **CSP estricta (`script-src 'self'`):** posible porque el HTML se pre-renderiza y no hay scripts en línea.
