import Link from "next/link";
import type { SessionPayload } from "@/lib/session";

export function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const links =
    session.role === "ADMIN"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/consultants", label: "Consultants" },
        ]
      : [{ href: "/consultant", label: "Mon suivi" }];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold tracking-tight">
              Apport<span className="text-indigo-600">Affaires</span>
            </span>
            <nav className="flex gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{session.name}</span>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
