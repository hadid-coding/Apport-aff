import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  computeApport,
  computeConsultantRevenue,
  isValidDaysWorked,
  isValidMonth,
} from "@/lib/calculations";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "CONSULTANT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData();
  const month = String(form.get("month") ?? "");
  const daysWorked = Number(form.get("daysWorked"));
  const note = String(form.get("note") ?? "").trim() || null;

  const back = (error: string) =>
    NextResponse.redirect(new URL(`/consultant?error=${error}`, request.url), 303);

  if (!isValidMonth(month)) return back("month");
  if (!isValidDaysWorked(daysWorked)) return back("days");

  const mission = await prisma.mission.findUnique({
    where: { consultantId: session.userId },
  });
  if (!mission) return back("mission");

  const existing = await prisma.cra.findUnique({
    where: { missionId_month: { missionId: mission.id, month } },
  });
  if (existing) return back("duplicate");

  await prisma.cra.create({
    data: {
      missionId: mission.id,
      month,
      daysWorked,
      consultantRevenue: computeConsultantRevenue(daysWorked, mission.tjm),
      apportAmount: computeApport(daysWorked, mission.apportRate),
      note,
    },
  });

  return NextResponse.redirect(new URL("/consultant?saved=1", request.url), 303);
}
