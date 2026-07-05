export type CraStatus = "SUBMITTED" | "DECLARED" | "CONFIRMED";

export type CraLike = {
  apportAmount: number;
  consultantRevenue: number;
  // string plutôt que CraStatus : SQLite ne supporte pas les enums Prisma
  status: string;
};

/** Arrondit à 2 décimales (centimes d'euro). */
export function roundEuros(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Montant de l'apport d'affaires pour un mois : jours travaillés × taux d'apport. */
export function computeApport(daysWorked: number, apportRate: number): number {
  return roundEuros(daysWorked * apportRate);
}

/** Chiffre d'affaires du consultant pour un mois : jours travaillés × TJM. */
export function computeConsultantRevenue(daysWorked: number, tjm: number): number {
  return roundEuros(daysWorked * tjm);
}

export type ApportSummary = {
  totalEarned: number; // total de l'apport dû (tous CRA)
  totalPaid: number; // versé et confirmé par l'admin
  totalDeclared: number; // virement déclaré par le consultant, en attente de confirmation
  totalOutstanding: number; // non versé (dû - confirmé)
  craCount: number;
  consultantRevenue: number;
};

/** Agrège les CRA en indicateurs versé / non versé. */
export function summarizeCras(cras: CraLike[]): ApportSummary {
  let totalEarned = 0;
  let totalPaid = 0;
  let totalDeclared = 0;
  let consultantRevenue = 0;

  for (const cra of cras) {
    totalEarned += cra.apportAmount;
    consultantRevenue += cra.consultantRevenue;
    if (cra.status === "CONFIRMED") totalPaid += cra.apportAmount;
    if (cra.status === "DECLARED") totalDeclared += cra.apportAmount;
  }

  return {
    totalEarned: roundEuros(totalEarned),
    totalPaid: roundEuros(totalPaid),
    totalDeclared: roundEuros(totalDeclared),
    totalOutstanding: roundEuros(totalEarned - totalPaid),
    craCount: cras.length,
    consultantRevenue: roundEuros(consultantRevenue),
  };
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Valide un mois au format "YYYY-MM". */
export function isValidMonth(month: string): boolean {
  return MONTH_RE.test(month);
}

/** Valide un nombre de jours travaillés (pas 0,5 accepté, max 31). */
export function isValidDaysWorked(days: number): boolean {
  return Number.isFinite(days) && days > 0 && days <= 31 && (days * 2) % 1 === 0;
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

/** Mois courant au format "YYYY-MM". */
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
