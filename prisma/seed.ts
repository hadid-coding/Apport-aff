import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "hadid.coding@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      activatedAt: new Date(),
    },
  });
  console.log(`Admin: ${admin.email} (mot de passe initial: ${adminPassword})`);

  const yassir = await prisma.user.upsert({
    where: { email: "yassir.chouaf@example.com" },
    update: {},
    create: {
      email: "yassir.chouaf@example.com",
      name: "Yassir CHOUAF",
      role: "CONSULTANT",
      inviteToken: crypto.randomBytes(24).toString("hex"),
      invitedAt: new Date(),
      mission: {
        create: {
          client: "EDF Nanterre",
          title: "Senior Data Engineer",
          tjm: 630,
          apportRate: 30,
        },
      },
    },
    include: { mission: true },
  });
  if (yassir.inviteToken) {
    console.log(
      `Consultant ${yassir.name} invité — lien d'activation: /activate/${yassir.inviteToken}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
