"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthDays, type MonthDay } from "@/lib/holidays";
import { formatEuros } from "@/lib/calculations";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/** Index 0..6 (lundi = 0) à partir de getDay() (dimanche = 0). */
function mondayIndex(weekday: number): number {
  return (weekday + 6) % 7;
}

function defaultsFor(days: MonthDay[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const d of days) map[d.iso] = d.defaultWorked;
  return map;
}

export function CraForm({
  defaultMonth,
  tjm,
  apportRate,
}: {
  defaultMonth: string;
  tjm: number;
  apportRate: number;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const days = useMemo(() => getMonthDays(month), [month]);
  const [worked, setWorked] = useState<Record<string, boolean>>(() =>
    defaultsFor(days)
  );

  // Réinitialise la grille aux valeurs par défaut quand le mois change.
  useEffect(() => {
    setWorked(defaultsFor(days));
  }, [days]);

  const total = days.reduce(
    (sum, d) => (!d.holiday && worked[d.iso] ? sum + 1 : sum),
    0
  );

  function toggle(d: MonthDay) {
    if (d.holiday) return; // un férié n'est jamais imputable
    setWorked((w) => ({ ...w, [d.iso]: !w[d.iso] }));
  }

  const leading = days.length > 0 ? mondayIndex(days[0].weekday) : 0;

  return (
    <form action="/api/cra" method="post" className="mt-4 space-y-4 text-sm">
      <div>
        <label htmlFor="month" className="block font-medium">
          Mois
        </label>
        <input
          id="month"
          name="month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Jours imputés</span>
          <span className="text-xs text-slate-500">
            cliquez pour retirer congés / absences
          </span>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((l, i) => (
            <div
              key={i}
              className="py-1 text-center text-[10px] font-medium uppercase text-slate-400"
            >
              {l}
            </div>
          ))}
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {days.map((d) => {
            const isWorked = !d.holiday && worked[d.iso];
            const base =
              "relative aspect-square rounded-md text-xs flex items-center justify-center border transition";
            let cls: string;
            if (d.holiday) {
              cls = "border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed";
            } else if (isWorked) {
              cls =
                "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700";
            } else if (d.isWeekend) {
              cls = "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100";
            } else {
              cls = "border-slate-300 bg-white text-slate-600 hover:bg-slate-50";
            }
            return (
              <button
                type="button"
                key={d.iso}
                onClick={() => toggle(d)}
                disabled={!!d.holiday}
                title={d.holiday ?? undefined}
                aria-pressed={isWorked}
                className={`${base} ${cls}`}
              >
                {d.day}
                {d.holiday ? (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-400" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-indigo-600" /> imputé
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-slate-100 ring-1 ring-slate-300" />{" "}
            non imputé / week-end
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-rose-100 ring-1 ring-rose-200" />{" "}
            férié (désactivé)
          </span>
        </div>
      </div>

      <div className="rounded-md bg-slate-50 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-600">Jours travaillés</span>
          <span
            data-testid="days-total"
            className="text-lg font-semibold tabular-nums"
          >
            {total}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
          <span>CA généré (TJM {formatEuros(tjm)})</span>
          <span className="tabular-nums">{formatEuros(total * tjm)}</span>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between text-xs text-slate-500">
          <span>Mon apport ({formatEuros(apportRate)}/j)</span>
          <span className="font-medium tabular-nums text-indigo-700">
            {formatEuros(total * apportRate)}
          </span>
        </div>
      </div>

      {/* Valeur calculée soumise au serveur */}
      <input type="hidden" name="daysWorked" value={total} />

      <div>
        <label htmlFor="note" className="block font-medium">
          Note (optionnel)
        </label>
        <input
          id="note"
          name="note"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <button
        disabled={total <= 0}
        className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Soumettre le CRA
      </button>
    </form>
  );
}
