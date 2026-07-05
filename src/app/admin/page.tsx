import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuros, formatMonth, summarizeCras } from "@/lib/calculations";
import { AppShell } from "@/components/AppShell";
import { KpiTile } from "@/components/KpiTile";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { confirmed?: string };
}) {
  const session = await requireAdmin();

  const cras = await prisma.cra.findMany({
    include: { mission: { include: { consultant: true } } },
    orderBy: { month: "desc" },
  });

  const summary = summarizeCras(cras);
  const toConfirm = cras.filter((c) => c.status === "DECLARED");
  const pending = cras.filter((c) => c.status === "SUBMITTED");

  return (
    <AppShell session={session}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/admin/consultants"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Ajouter un consultant
        </Link>
      </div>

      {searchParams.confirmed ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Réception du virement confirmée.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Apport total dû"
          value={formatEuros(summary.totalEarned)}
          hint={`${summary.craCount} CRA soumis`}
        />
        <KpiTile label="Versé (confirmé)" value={formatEuros(summary.totalPaid)} />
        <KpiTile
          label="Non versé"
          value={formatEuros(summary.totalOutstanding)}
          hint={
            summary.totalDeclared > 0
              ? `dont ${formatEuros(summary.totalDeclared)} déclaré en attente`
              : undefined
          }
        />
        <KpiTile
          label="CA consultants généré"
          value={formatEuros(summary.consultantRevenue)}
        />
      </div>

      {toConfirm.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Virements à confirmer ({toConfirm.length})
          </h2>
          <p className="text-sm text-slate-500">
            Le consultant a déclaré le virement — confirmez la réception sur votre
            compte.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Consultant</th>
                  <th className="px-4 py-3">Mois</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Déclaré le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {toConfirm.map((cra) => (
                  <tr key={cra.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{cra.mission.consultant.name}</td>
                    <td className="px-4 py-3">{formatMonth(cra.month)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatEuros(cra.apportAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cra.transferDeclaredAt?.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={`/api/cra/${cra.id}/confirm`} method="post">
                        <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                          Confirmer la réception
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Historique des CRA</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Consultant</th>
                <th className="px-4 py-3">Mois</th>
                <th className="px-4 py-3 text-right">Jours</th>
                <th className="px-4 py-3 text-right">Apport</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Aucun CRA soumis pour le moment.
                  </td>
                </tr>
              ) : (
                cras.map((cra) => (
                  <tr key={cra.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/consultants/${cra.mission.consultantId}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {cra.mission.consultant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatMonth(cra.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {cra.daysWorked}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatEuros(cra.apportAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cra.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cra.status !== "CONFIRMED" ? (
                        <form action={`/api/cra/${cra.id}/confirm`} method="post">
                          <button className="text-xs text-emerald-700 hover:underline">
                            Marquer versé
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
        {pending.length > 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            « Marquer versé » permet de confirmer directement un virement reçu même
            si le consultant n&apos;a pas fait la déclaration dans l&apos;outil.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
