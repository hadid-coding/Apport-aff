import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect303 } from "@/lib/http";

/** Le consultant déclare avoir envoyé le virement de l'apport. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.role !== "CONSULTANT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const cra = await prisma.cra.findUnique({
    where: { id: params.id },
    include: { mission: true },
  });

  if (!cra || cra.mission.consultantId !== session.userId) {
    return NextResponse.json({ error: "CRA introuvable" }, { status: 404 });
  }
  if (cra.status !== "SUBMITTED") {
    return redirect303("/consultant?error=status");
  }

  await prisma.cra.update({
    where: { id: cra.id },
    data: { status: "DECLARED", transferDeclaredAt: new Date() },
  });

  return redirect303("/consultant?declared=1");
}
