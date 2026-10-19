/**
 * Semilla de datos REALES mínimos. No inventa carreras, materias, dominios de
 * correo ni precios: eso lo administra el equipo desde el panel admin.
 * Los datos ficticios de la feria se cargan con un seed distinto (Fase 16) y
 * todos llevan isDemo = true.
 */
import { getUnfilteredClient } from "../src/index";

async function main() {
  const prisma = getUnfilteredClient();

  await prisma.university.upsert({
    where: { slug: "universidad-don-bosco" },
    update: {},
    create: {
      name: "Universidad Don Bosco",
      slug: "universidad-don-bosco",
      emailDomains: [], // vacío ⇒ verificación manual hasta que el admin configure el dominio
    },
  });

  await prisma.plan.upsert({
    where: { code: "FREE" },
    update: {},
    create: { code: "FREE", name: "Free", priceCents: 0, features: { summary: "Funciones básicas" } },
  });
  await prisma.plan.upsert({
    where: { code: "PRO" },
    update: {},
    // Precio sin definir: se fija desde admin. La idea inicial es $3–$5/mes, pero no se asume.
    create: { code: "PRO", name: "Pro", priceCents: null, features: { summary: "Funciones adicionales" } },
  });

  console.log("Seed base aplicado (universidad, planes).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
