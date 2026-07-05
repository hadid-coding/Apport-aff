import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** L'admin confirme la réception du virement de l'apport. */
export async function POST(
  request: NextRequest,
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
    return NextResponse.redirect(new URL("/admin?error=already", request.url), 303);
  }

  await prisma.cra.update({
    where: { id: cra.id },
    data: { status: "CONFIRMED", transferConfirmedAt: new Date() },
  });

  return NextResponse.redirect(new URL("/admin?confirmed=1", request.url), 303);
}
