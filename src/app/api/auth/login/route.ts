import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { redirect303 } from "@/lib/http";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const fail = () => redirect303("/login?error=1");

  if (!email || !password) return fail();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return fail();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return fail();

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "CONSULTANT",
  });

  const destination = user.role === "ADMIN" ? "/admin" : "/consultant";
  const response = redirect303(destination);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
