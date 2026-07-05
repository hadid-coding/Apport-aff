import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { redirect303 } from "@/lib/http";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const backUrl = (error: string) =>
    redirect303(`/activate/${token}?error=${error}`);

  if (!token) {
    return redirect303("/login");
  }
  if (password.length < 8) return backUrl("weak");
  if (password !== confirm) return backUrl("mismatch");

  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user) return backUrl("invalid");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      inviteToken: null,
      activatedAt: new Date(),
    },
  });

  const sessionToken = await signSession({
    userId: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role as "ADMIN" | "CONSULTANT",
  });

  const destination = updated.role === "ADMIN" ? "/admin" : "/consultant";
  const response = redirect303(destination);
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);
  return response;
}
