import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/session";

/** Session courante, ou null si non connecté. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Redirige vers /login si non connecté. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Redirige si l'utilisateur n'est pas admin. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/consultant");
  return session;
}

/** Redirige si l'utilisateur n'est pas consultant. */
export async function requireConsultant(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "CONSULTANT") redirect("/admin");
  return session;
}
