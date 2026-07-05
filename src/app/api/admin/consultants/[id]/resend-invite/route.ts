import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect303 } from "@/lib/http";
import { inviteUrl } from "@/lib/invite";
import { sendInvitationEmail } from "@/lib/mailer";

/** Renvoie l'email d'invitation à un consultant dont le compte n'est pas encore activé. */
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
  // Compte déjà activé : plus de jeton, rien à renvoyer.
  if (!consultant.inviteToken) {
    return redirect303("/admin/consultants?error=activated");
  }

  const mail = await sendInvitationEmail({
    to: consultant.email,
    name: consultant.name,
    activateUrl: inviteUrl(consultant.inviteToken),
  });
  const mailStatus = mail.sent ? "sent" : mail.skipped ? "skipped" : "failed";

  return redirect303(
    `/admin/consultants?invited=${consultant.id}&mail=${mailStatus}`
  );
}
