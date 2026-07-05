import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect303 } from "@/lib/http";

const consultantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  client: z.string().min(1),
  title: z.string().min(1),
  tjm: z.coerce.number().positive(),
  apportRate: z.coerce.number().positive(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = consultantSchema.safeParse({
    name: form.get("name"),
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    client: form.get("client"),
    title: form.get("title"),
    tjm: form.get("tjm"),
    apportRate: form.get("apportRate"),
  });

  if (!parsed.success) {
    return redirect303("/admin/consultants?error=invalid");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return redirect303("/admin/consultants?error=exists");
  }

  const consultant = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "CONSULTANT",
      inviteToken: crypto.randomBytes(24).toString("hex"),
      invitedAt: new Date(),
      mission: {
        create: {
          client: parsed.data.client,
          title: parsed.data.title,
          tjm: parsed.data.tjm,
          apportRate: parsed.data.apportRate,
        },
      },
    },
  });

  return redirect303(`/admin/consultants?invited=${consultant.id}`);
}
