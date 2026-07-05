import { requireConsultant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  currentMonth,
  formatEuros,
  formatMonth,
  summarizeCras,
} from "@/lib/calculations";
import { AppShell } from "@/components/AppShell";
import { KpiTile } from "@/components/KpiTile";
import { StatusBadge } from "@/components/StatusBadge";
import { CraForm } from "@/components/CraForm";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  month: "Mois invalide.",
  days: "Nombre de jours invalide — sélectionnez au moins un jour.",
  duplicate: "Un CRA existe déjà pour ce mois.",
  mission: "Aucune mission active — contactez votre administrateur.",
  status: "Ce CRA n'est pas en attente de virement.",
};

export default async function ConsultantDashboard({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string; declared?: string };
}) {
  const session = await requireConsultant();

  const mission = await prisma.mission.findUnique({
    where: { consultantId: session.userId },
    include: { cras: { orderBy: { month: "desc" } } },
  });

  const cras = mission?.cras ?? [];
  const summary = summarizeCras(cras);
  const error = searchParams.error ? ERRORS[searchParams.error] : null;

  return (
    <AppShell session={session}>
      <h1 className="text-2xl font-semibold">Mon suivi</h1>
      {mission ? (
        <p className="text-sm text-slate-500">
          {mission.title} @ {mission.client} — TJM {formatEuros(mission.tjm)} HT,
          apport d&apos;affaires {formatEuros(mission.apportRate)} HT / jour travaillé
        </p>
      ) : (
        <p className="text-sm text-amber-700">
          Aucune mission active — contactez votre administrateur.
        </p>
      )}

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {searchParams.saved ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          CRA enregistré — le montant de l&apos;apport a été calculé.
        </p>
      ) : null}
      {searchParams.declared ? (
        <p className="mt-4 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Virement déclaré — en attente de confirmation de réception par
          l&apos;administrateur.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="CA généré"
          value={formatEuros(summary.consultantRevenue)}
          hint={`${summary.craCount} CRA soumis`}
        />
        <KpiTile label="Apport total dû" value={formatEuros(summary.totalEarned)} />
        <KpiTile label="Déjà versé (confirmé)" value={formatEuros(summary.totalPaid)} />
        <KpiTile
          label="Reste à verser"
          value={formatEuros(summary.totalOutstanding)}
          hint={
            summary.totalDeclared > 0
              ? `dont ${formatEuros(summary.totalDeclared)} déclaré, en attente de confirmation`
              : undefined
          }
        />
      </div>

      {mission ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="h-fit rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Saisir mon CRA du mois</h2>
            <p className="mt-1 text-xs text-slate-500">
              Les jours ouvrés sont imputés par défaut (fériés désactivés).
              Retirez vos congés et absences, l&apos;apport est calculé
              automatiquement.
            </p>
            <CraForm
              defaultMonth={currentMonth()}
              tjm={mission.tjm}
              apportRate={mission.apportRate}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Mes CRA</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Mois</th>
                    <th className="px-4 py-3 text-right">Jours</th>
                    <th className="px-4 py-3 text-right">CA généré</th>
                    <th className="px-4 py-3 text-right">Apport dû</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cras.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Aucun CRA — saisissez votre premier mois.
                      </td>
                    </tr>
                  ) : (
                    cras.map((cra) => (
                      <tr key={cra.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">{formatMonth(cra.month)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {cra.daysWorked}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {formatEuros(cra.consultantRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatEuros(cra.apportAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={cra.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {cra.status === "SUBMITTED" ? (
                            <form action={`/api/cra/${cra.id}/declare`} method="post">
                              <button className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700">
                                J&apos;ai envoyé le virement
                              </button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
