import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect303 } from "@/lib/http";

/**
 * Supprime un consultant et, en cascade (schéma Prisma), sa mission et ses CRA.
 * Action réservée à l'admin.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const consultant = await prisma.user.findUnique({ where: { id: params.id } });
  if (!consultant || consultant.role !== "CONSULTANT") {
    return NextResponse.json({ error: "Consultant introuvable" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: consultant.id } });

  return redirect303("/admin/consultants?deleted=1");
}
