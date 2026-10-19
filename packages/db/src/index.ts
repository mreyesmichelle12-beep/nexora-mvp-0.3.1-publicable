import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Modelos que tienen la columna `isDemo`. Los datos ficticios de la feria viven
 * en la BD marcados con isDemo = true y NUNCA deben aparecer en consultas reales.
 * El filtro se aplica aquí, en un único lugar, para que ningún servicio lo olvide.
 */
const DEMO_AWARE = new Set([
  "User",
  "StudyRoom",
  "Conference",
  "TeacherClass",
  "LibraryFile",
  "AnalyticsEvent",
]);

const FILTERED_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

function createClient(opts: { includeDemo: boolean }) {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  if (opts.includeDemo) return base;

  return base.$extends({
    name: "exclude-demo-data",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (DEMO_AWARE.has(model) && FILTERED_OPS.has(operation)) {
            const a = args as { where?: Prisma.JsonObject };
            a.where = { AND: [a.where ?? {}, { isDemo: false }] } as never;
          }
          return query(args);
        },
      },
    },
  });
}

type ProdClient = ReturnType<typeof createClient>;
const g = globalThis as unknown as { __nexoraDb?: ProdClient; __nexoraSeedDb?: PrismaClient };

/** Cliente de la aplicación: excluye automáticamente datos demo. */
export const db: ProdClient = g.__nexoraDb ?? createClient({ includeDemo: false });
if (process.env.NODE_ENV !== "production") g.__nexoraDb = db;

/** Cliente sin filtro: SOLO para seeds y herramientas de administración del demo. */
export function getUnfilteredClient(): PrismaClient {
  g.__nexoraSeedDb ??= createClient({ includeDemo: true }) as PrismaClient;
  return g.__nexoraSeedDb;
}

export { Prisma };
export type * from "@prisma/client";
