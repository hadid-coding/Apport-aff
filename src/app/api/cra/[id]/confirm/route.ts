import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect303 } from "@/lib/http";

/** L'admin confirme la réception du virement de l'apport. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const cra = await prisma.cra.findUnique({ where: { id: params.id } });
  if (!cra) {
    return NextResponse.json({ error: "CRA introuvable" }, { status: 404 });
  }
  if (cra.status === "CONFIRMED") {
    return redirect303("/admin?error=already");
  }

  await prisma.cra.update({
    where: { id: cra.id },
    data: { status: "CONFIRMED", transferConfirmedAt: new Date() },
  });

  return redirect303("/admin?confirmed=1");
}
