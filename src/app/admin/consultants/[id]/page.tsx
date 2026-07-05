import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuros, formatMonth, summarizeCras } from "@/lib/calculations";
import { AppShell } from "@/components/AppShell";
import { KpiTile } from "@/components/KpiTile";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ConsultantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAdmin();

  const consultant = await prisma.user.findUnique({
    where: { id: params.id, role: "CONSULTANT" },
    include: {
      mission: { include: { cras: { orderBy: { month: "desc" } } } },
    },
  });
  if (!consultant) notFound();

  const cras = consultant.mission?.cras ?? [];
  const summary = summarizeCras(cras);

  return (
    <AppShell session={session}>
      <Link href="/admin/consultants" className="text-sm text-indigo-600 hover:underline">
        ← Consultants
      </Link>
      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{consultant.name}</h1>
          <p className="text-sm text-slate-500">
            {consultant.email}
            {consultant.mission
              ? ` — ${consultant.mission.title} @ ${consultant.mission.client} (TJM ${formatEuros(consultant.mission.tjm)}, apport ${formatEuros(consultant.mission.apportRate)}/j)`
              : null}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile label="Apport total dû" value={formatEuros(summary.totalEarned)} />
        <KpiTile label="Versé (confirmé)" value={formatEuros(summary.totalPaid)} />
        <KpiTile label="Non versé" value={formatEuros(summary.totalOutstanding)} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">CRA mensuels</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mois</th>
                <th className="px-4 py-3 text-right">Jours</th>
                <th className="px-4 py-3 text-right">CA consultant</th>
                <th className="px-4 py-3 text-right">Apport</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Confirmé le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Aucun CRA soumis.
                  </td>
                </tr>
              ) : (
                cras.map((cra) => (
                  <tr key={cra.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{formatMonth(cra.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{cra.daysWorked}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatEuros(cra.consultantRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatEuros(cra.apportAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cra.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cra.transferConfirmedAt?.toLocaleDateString("fr-FR") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cra.status !== "CONFIRMED" ? (
                        <form action={`/api/cra/${cra.id}/confirm`} method="post">
                          <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                            Confirmer la réception
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
      </section>
    </AppShell>
  );
}
