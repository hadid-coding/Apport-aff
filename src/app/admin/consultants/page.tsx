import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuros, summarizeCras } from "@/lib/calculations";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid: "Formulaire invalide — vérifiez les champs saisis.",
  exists: "Un compte existe déjà avec cet email.",
};

function inviteUrl(token: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/activate/${token}`;
}

export default async function ConsultantsPage({
  searchParams,
}: {
  searchParams: { invited?: string; error?: string };
}) {
  const session = await requireAdmin();

  const consultants = await prisma.user.findMany({
    where: { role: "CONSULTANT" },
    include: { mission: { include: { cras: true } } },
    orderBy: { createdAt: "asc" },
  });

  const invited = searchParams.invited
    ? consultants.find((c) => c.id === searchParams.invited)
    : null;
  const error = searchParams.error ? ERRORS[searchParams.error] : null;

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-semibold">Consultants</h1>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {invited?.inviteToken ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-medium text-emerald-800">
            {invited.name} a été ajouté. Envoyez-lui ce lien d&apos;activation pour
            qu&apos;il crée son mot de passe :
          </p>
          <code className="mt-2 block select-all break-all rounded bg-white px-2 py-1 text-xs text-slate-700">
            {inviteUrl(invited.inviteToken)}
          </code>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Mission</th>
                <th className="px-4 py-3 text-right">TJM</th>
                <th className="px-4 py-3 text-right">Apport/j</th>
                <th className="px-4 py-3 text-right">Non versé</th>
                <th className="px-4 py-3">Compte</th>
              </tr>
            </thead>
            <tbody>
              {consultants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Aucun consultant pour le moment.
                  </td>
                </tr>
              ) : (
                consultants.map((c) => {
                  const summary = summarizeCras(c.mission?.cras ?? []);
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/consultants/${c.id}`}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.mission ? (
                          <>
                            {c.mission.title}
                            <p className="text-xs text-slate-400">{c.mission.client}</p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.mission ? formatEuros(c.mission.tjm) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.mission ? formatEuros(c.mission.apportRate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatEuros(summary.totalOutstanding)}
                      </td>
                      <td className="px-4 py-3">
                        {c.activatedAt ? (
                          <span className="text-xs text-emerald-700">✓ Activé</span>
                        ) : c.inviteToken ? (
                          <details className="text-xs text-amber-700">
                            <summary className="cursor-pointer">Invitation en attente</summary>
                            <code className="mt-1 block select-all break-all rounded bg-slate-50 px-1 py-0.5 text-[10px] text-slate-600">
                              {inviteUrl(c.inviteToken)}
                            </code>
                          </details>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Ajouter un consultant</h2>
          <p className="mt-1 text-xs text-slate-500">
            Un lien d&apos;activation sera généré — le consultant choisira son propre
            mot de passe.
          </p>
          <form
            action="/api/admin/consultants"
            method="post"
            className="mt-4 space-y-3 text-sm"
          >
            <div>
              <label htmlFor="name" className="block font-medium">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="email" className="block font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="title" className="block font-medium">
                Poste / mission
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="Senior Data Engineer"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="client" className="block font-medium">
                Client
              </label>
              <input
                id="client"
                name="client"
                required
                placeholder="EDF Nanterre"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tjm" className="block font-medium">
                  TJM (€ HT)
                </label>
                <input
                  id="tjm"
                  name="tjm"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="630"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="apportRate" className="block font-medium">
                  Apport €/jour
                </label>
                <input
                  id="apportRate"
                  name="apportRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="30"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <button className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700">
              Créer et générer le lien
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
