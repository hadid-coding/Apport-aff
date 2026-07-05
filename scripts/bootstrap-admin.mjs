// Crée le compte admin au premier démarrage à partir des variables
// d'environnement, si aucun admin avec cet email n'existe déjà.
// Idempotent : ne réinitialise jamais un mot de passe existant.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.log(
    "[bootstrap] ADMIN_EMAIL / ADMIN_PASSWORD non définis — aucun admin créé."
  );
  await prisma.$disconnect();
  process.exit(0);
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log(`[bootstrap] Admin ${email} déjà présent — inchangé.`);
} else {
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
      activatedAt: new Date(),
    },
  });
  console.log(`[bootstrap] Admin ${email} créé.`);
}

await prisma.$disconnect();
process.exit(0);
