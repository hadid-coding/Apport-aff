import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const fail = () =>
    NextResponse.redirect(new URL("/login?error=1", request.url), 303);

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
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
