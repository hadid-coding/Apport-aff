import { describe, expect, it } from "vitest";
import {
  computeApport,
  computeConsultantRevenue,
  currentMonth,
  isValidDaysWorked,
  isValidMonth,
  roundEuros,
  summarizeCras,
  type CraLike,
} from "@/lib/calculations";

describe("computeApport", () => {
  it("calcule l'apport pour un mois complet (cas Yassir : 20 j × 30 €)", () => {
    expect(computeApport(20, 30)).toBe(600);
  });

  it("gère les demi-journées", () => {
    expect(computeApport(18.5, 30)).toBe(555);
  });

  it("arrondit au centime", () => {
    expect(computeApport(3, 33.333)).toBe(100);
  });
});

describe("computeConsultantRevenue", () => {
  it("calcule le CA du consultant (20 j × 630 €)", () => {
    expect(computeConsultantRevenue(20, 630)).toBe(12600);
  });
});

describe("roundEuros", () => {
  it("évite les erreurs de flottants", () => {
    expect(roundEuros(0.1 + 0.2)).toBe(0.3);
  });
});

describe("summarizeCras", () => {
  const cras: CraLike[] = [
    { apportAmount: 600, consultantRevenue: 12600, status: "CONFIRMED" },
    { apportAmount: 555, consultantRevenue: 11655, status: "DECLARED" },
    { apportAmount: 630, consultantRevenue: 13230, status: "SUBMITTED" },
  ];

  it("agrège le total dû", () => {
    expect(summarizeCras(cras).totalEarned).toBe(1785);
  });

  it("ne compte comme versé que les virements confirmés par l'admin", () => {
    const summary = summarizeCras(cras);
    expect(summary.totalPaid).toBe(600);
    expect(summary.totalDeclared).toBe(555);
  });

  it("calcule le non versé = dû - confirmé (le déclaré reste non versé)", () => {
    expect(summarizeCras(cras).totalOutstanding).toBe(1185);
  });

  it("agrège le CA consultant", () => {
    expect(summarizeCras(cras).consultantRevenue).toBe(37485);
  });

  it("retourne des zéros sans CRA", () => {
    expect(summarizeCras([])).toEqual({
      totalEarned: 0,
      totalPaid: 0,
      totalDeclared: 0,
      totalOutstanding: 0,
      craCount: 0,
      consultantRevenue: 0,
    });
  });
});

describe("isValidMonth", () => {
  it("accepte YYYY-MM", () => {
    expect(isValidMonth("2026-07")).toBe(true);
    expect(isValidMonth("2026-12")).toBe(true);
  });

  it("rejette les formats invalides", () => {
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-00")).toBe(false);
    expect(isValidMonth("07-2026")).toBe(false);
    expect(isValidMonth("2026-7")).toBe(false);
    expect(isValidMonth("")).toBe(false);
  });
});

describe("isValidDaysWorked", () => {
  it("accepte les jours entiers et demi-journées", () => {
    expect(isValidDaysWorked(20)).toBe(true);
    expect(isValidDaysWorked(0.5)).toBe(true);
    expect(isValidDaysWorked(18.5)).toBe(true);
  });

  it("rejette zéro, négatif, > 31 et les fractions non demi-journées", () => {
    expect(isValidDaysWorked(0)).toBe(false);
    expect(isValidDaysWorked(-1)).toBe(false);
    expect(isValidDaysWorked(32)).toBe(false);
    expect(isValidDaysWorked(20.3)).toBe(false);
    expect(isValidDaysWorked(NaN)).toBe(false);
  });
});

describe("currentMonth", () => {
  it("formate le mois courant en YYYY-MM", () => {
    expect(currentMonth(new Date(2026, 6, 5))).toBe("2026-07");
    expect(currentMonth(new Date(2026, 0, 1))).toBe("2026-01");
  });
});
