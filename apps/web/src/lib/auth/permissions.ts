/**
 * Control de acceso central. TODA acción protegida del servidor debe pasar por `can()`.
 * Ocultar un botón en la interfaz NO es control de acceso.
 */
export const ROLES = ["STUDENT", "MENTOR", "TEACHER", "CONFERENCE_HOST", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export type VerificationStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BLOCKED" | "DELETED";

export interface RoleGrant {
  role: Role;
  verification: VerificationStatus;
}

export interface Actor {
  id: string;
  status: UserStatus;
  roles: RoleGrant[];
  isDemo: boolean;
}

export type Action =
  | "social:use" // Smart Match, conexiones, mensajes
  | "library:upload"
  | "library:moderate"
  | "room:create"
  | "room:manage"
  | "class:create"
  | "conference:create"
  | "file:delete"
  | "admin:access"
  | "user:manage"
  | "catalog:manage"
  | "verification:review"
  | "content:manage"
  | "report:review";

export interface Resource {
  ownerId?: string;
}

/** Roles que exigen verificación APROBADA antes de tener efecto. */
const REQUIRES_APPROVAL: ReadonlySet<Role> = new Set(["MENTOR", "TEACHER", "CONFERENCE_HOST"]);

const MATRIX: Record<Action, readonly Role[]> = {
  "social:use": ["STUDENT", "MENTOR", "TEACHER", "CONFERENCE_HOST"],
  "library:upload": ["STUDENT", "MENTOR", "TEACHER", "CONFERENCE_HOST", "ADMIN"],
  "library:moderate": ["ADMIN"],
  "room:create": ["STUDENT", "MENTOR", "TEACHER"],
  "room:manage": ["STUDENT", "MENTOR", "TEACHER", "ADMIN"], // además exige ser dueño (o admin)
  "class:create": ["MENTOR", "TEACHER", "ADMIN"],
  "conference:create": ["MENTOR", "TEACHER", "CONFERENCE_HOST", "ADMIN"],
  "file:delete": ["STUDENT", "MENTOR", "TEACHER", "CONFERENCE_HOST", "ADMIN"], // dueño o admin
  "admin:access": ["ADMIN"],
  "user:manage": ["ADMIN"],
  "catalog:manage": ["ADMIN"],
  "verification:review": ["ADMIN"],
  "content:manage": ["ADMIN"],
  "report:review": ["ADMIN"],
};

/** Acciones que sólo el dueño del recurso (o un ADMIN) puede ejecutar. */
const OWNER_ONLY: ReadonlySet<Action> = new Set(["room:manage", "file:delete"]);

/** Un actor de demo nunca puede tocar administración ni moderación. */
const DENIED_FOR_DEMO: ReadonlySet<Action> = new Set([
  "admin:access",
  "user:manage",
  "catalog:manage",
  "verification:review",
  "content:manage",
  "report:review",
  "library:moderate",
]);

/** Roles que el actor tiene realmente vigentes (activos y, si aplica, verificados). */
export function effectiveRoles(actor: Actor): Role[] {
  return actor.roles
    .filter((g) =>
      REQUIRES_APPROVAL.has(g.role)
        ? g.verification === "APPROVED"
        : g.verification === "NOT_REQUIRED" || g.verification === "APPROVED",
    )
    .map((g) => g.role);
}

export function can(actor: Actor | null | undefined, action: Action, resource?: Resource): boolean {
  if (!actor) return false;
  if (actor.status !== "ACTIVE") return false;
  if (actor.isDemo && DENIED_FOR_DEMO.has(action)) return false;

  const roles = effectiveRoles(actor);
  const allowedRoles = MATRIX[action];
  if (!roles.some((r) => allowedRoles.includes(r))) return false;

  if (OWNER_ONLY.has(action)) {
    const isAdmin = roles.includes("ADMIN");
    if (!isAdmin && (!resource?.ownerId || resource.ownerId !== actor.id)) return false;
  }
  return true;
}

/** Lanza si no hay permiso. Úsalo al inicio de cada Server Action / route handler. */
export class ForbiddenError extends Error {
  readonly action: Action;
  constructor(action: Action) {
    super("forbidden");
    this.name = "ForbiddenError";
    this.action = action;
  }
}
export function assertCan(actor: Actor | null | undefined, action: Action, resource?: Resource): asserts actor is Actor {
  if (!can(actor, action, resource)) throw new ForbiddenError(action);
}
