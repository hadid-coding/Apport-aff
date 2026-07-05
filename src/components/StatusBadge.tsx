const STATUS_CONFIG = {
  SUBMITTED: {
    label: "En attente de virement",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  DECLARED: {
    label: "Virement déclaré",
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  CONFIRMED: {
    label: "Versé — confirmé",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const config =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.SUBMITTED;
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
