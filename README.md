# NEXORA

> Conecta. Aprende. Evoluciona.

Ecosistema educativo híbrido que conecta estudiantes, docentes y oportunidades de aprendizaje.
Diseñado inicialmente para estudiantes universitarios de El Salvador, empezando por la comunidad de la Universidad Don Bosco.

**Estado: NEXORA MVP 0.3 — primera versión ejecutable (sitio público + primera experiencia funcional de estudiante). Auditoría final de producción pendiente.**
Incluye 20 rutas públicas, contenido basado en el *Documento Maestro de Contenido*, formulario de contacto, banner de cookies,
SEO base y un arnés de verificación visual (`tools/preview`). Cuentas, demo y funciones de la plataforma llegan en fases siguientes.

## ▶ Abrir NEXORA MVP 0.3

```bash
node apps/mvp/server.mjs      # requiere Node ≥ 22.18; no hace falta npm install
# → http://localhost:3000
```
Detalles, alcance real y lo que aún no existe: [apps/mvp/README.md](apps/mvp/README.md). Cómo publicarlo: [docs/DEPLOY.md](docs/DEPLOY.md).

## Regla del proyecto: nada se simula

Una función que depende de un servicio externo (correo, Google, almacenamiento, video, IA, pagos) está
**implementada y desactivada** hasta que existan sus credenciales. La interfaz dice exactamente qué variable falta.
Los datos ficticios de la feria llevan `isDemo = true` y se excluyen de toda consulta real mediante un filtro central
(`packages/db/src/index.ts`). Ver [docs/DECISIONS.md](docs/DECISIONS.md).

## Arquitectura

Monolito modular (Next.js) + servicio de tiempo real separado (Fase 9). Tres experiencias aisladas por grupos de rutas:
`(public)`, `(app)` / `(teacher)` y `(admin)`, más `/demo`.

```
nexora/
├─ apps/web/                 Next.js 15 · React 19 · TypeScript · CSS propio con variables
│  ├─ src/app/               rutas (layout, 404, error, /api/health, /design-system [solo dev])
│  ├─ src/components/ui/     botón, campo, badge, card, estados, banner demo, logo
│  ├─ src/lib/auth/          permisos (can), sesiones, cookies
│  ├─ src/lib/security/      CSP, CSRF, tokens, rate limit, política de contraseñas, argon2id
│  ├─ src/lib/config/        validación de entorno y estado de integraciones
│  ├─ src/middleware.ts      CSP con nonce por petición
│  └─ tests/                 pruebas unitarias (node:test, sin dependencias)
├─ packages/db/              esquema Prisma, cliente con filtro demo, seed
├─ tools/preview/            arnés de verificación: empaqueta las páginas reales y las renderiza en Chromium
├─ docs/DECISIONS.md         decisiones técnicas y alternativas
├─ docker-compose.yml        PostgreSQL + Redis para desarrollo
└─ .env.example              todas las variables, con su estado (obligatoria / opcional)
```

## Puesta en marcha local

Requisitos: Node ≥ 20.11, Docker (para PostgreSQL y Redis).

```bash
npm install
cp .env.example apps/web/.env.local     # completa APP_URL, DATABASE_URL, SESSION_SECRET, LOG_PEPPER
cp apps/web/.env.local packages/db/.env # Prisma lee DATABASE_URL de aquí
npm run db:up                           # PostgreSQL + Redis
npm run db:generate
npm run db:migrate -- --name init       # crea las tablas
npm run db:seed                         # Universidad Don Bosco + planes FREE/PRO (sin precios inventados)
npm run dev                             # http://localhost:3000
```

Secretos: `openssl rand -base64 48` para `SESSION_SECRET`, `openssl rand -base64 32` para `LOG_PEPPER`.

## Pruebas

```bash
npm test          # 41 pruebas unitarias: permisos, sesiones, tokens, CSP, CSRF, rate limit, contraseñas, integraciones
npm run typecheck
npm run lint
```

## Servicios externos (configuración)

| Servicio | Variables | Fase | Si falta |
|---|---|---|---|
| Correo | `EMAIL_PROVIDER`, `RESEND_API_KEY` o `SMTP_URL`, `EMAIL_FROM` | 4 | Registro no puede verificar correos |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 4 | Botón desactivado con aviso |
| Almacenamiento (S3/R2) | `STORAGE_*` | 7 | Biblioteca sin subida |
| Video (LiveKit) | `LIVEKIT_*` | 9 | Sala sin video; se indica |
| Tiempo real (Yjs) | `REALTIME_URL`, `REALTIME_TOKEN_SECRET` | 9 | Pizarra y temporizador sólo locales |
| IA | `AI_PROVIDER`, `ANTHROPIC_API_KEY` | 11 | NEXORA AI desactivada con aviso |
| Pagos (Stripe) | `STRIPE_*` | 12 | Flujo marcado como demo; nunca “pago exitoso” |
| Analítica | `ANALYTICS_PROVIDER`, `PLAUSIBLE_DOMAIN` / `GA4_MEASUREMENT_ID` | 3 | No se carga ningún script |

## Datos que debes proporcionar (no se inventan)

Dominio · Instagram (`INSTAGRAM_URL`, `INSTAGRAM_USERNAME`) · correo (`CONTACT_EMAIL`) · fotos y nombres del equipo ·
fotos de productos · historia del proyecto · datos reales de *Huellas que Transforman* · precios definitivos ·
dominios de correo institucional por universidad · carreras y materias (se cargan desde el panel admin).

## Roadmap

| Entrega | Fases | Contenido | Estado |
|---|---|---|---|
| 1 | 1–2 | Base, esquema, seguridad, diseño | **esta entrega** |
| 2 | 3 | Web pública, SEO, legal, cookies | pendiente |
| 3 | 4–5 | Registro, login, verificación, perfil, dashboard, demo | pendiente |
| 4 | 6–8 | Smart Match, biblioteca, conexiones, mensajes | pendiente |
| 5 | 9–10 | Study Rooms, pizarra, docentes, conferencias | pendiente |
| 6 | 11–13 | NEXORA AI, planes y pagos, admin | pendiente |
| 7 | 14–16 | Endurecimiento, accesibilidad, rendimiento, despliegue | pendiente |

## Aviso legal

Los textos legales (privacidad, términos, cookies) serán borradores y **deben ser revisados por un abogado**.
Este proyecto no afirma cumplimiento legal.

## Web pública (Fase 3)

Rutas: `/` · `/nosotros` · `/historia` · `/equipo` · `/plataforma` · `/funciones` · `/estudiantes` · `/docentes` · `/productos` ·
`/impacto-social` · `/planes` · `/faq` · `/contacto` · `/privacidad` · `/terminos` · `/aviso-legal` · `/cookies`, más
`/iniciar-sesion`, `/registro` y `/demo` (provisionales, `noindex`, sin formularios falsos), 404 y error.

**Dónde editar contenido:** todo el texto público vive en `apps/web/src/content/site.ts`.
- Roles y descripciones del equipo: `TEAM[].role` / `.bio` (hoy `null` ⇒ “Equipo fundador” + campo pendiente).
- Asignación de fotos: `TEAM[].photo` (las fotos están en `apps/web/public/team/`; se asignaron según el orden de los pies de foto del PDF; **confirma que cada nombre corresponde a su foto**).
- Fotos de productos: `PRODUCTS[].photo`. Precios y características de productos: no existen en el modelo a propósito.
- Cifras de Huellas que Transforman: `IMPACT_DATA` (los porcentajes y totales se calculan; hay una prueba que los verifica).
- Contacto: variables `CONTACT_EMAIL`, `INSTAGRAM_URL`, `INSTAGRAM_USERNAME`. Vacías ⇒ placeholder visible.
- Indexación: `SITE_INDEXABLE=false` (por defecto) ⇒ `noindex` en todas las páginas y `robots.txt` bloquea el sitio.

**Verificación visual** (requiere esbuild, react-icons y playwright):
`node tools/preview/build.mjs && node tools/preview/flows.mjs` (ver cabecera de cada script).
