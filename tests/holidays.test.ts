import { describe, expect, it } from "vitest";
import {
  businessDaysInMonth,
  easterSunday,
  frenchHolidays,
  getMonthDays,
} from "@/lib/holidays";

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("easterSunday", () => {
  it("calcule Pâques (dates connues)", () => {
    expect(isoOf(easterSunday(2024))).toBe("2024-03-31");
    expect(isoOf(easterSunday(2025))).toBe("2025-04-20");
    expect(isoOf(easterSunday(2026))).toBe("2026-04-05");
  });
});

describe("frenchHolidays", () => {
  const h2026 = frenchHolidays(2026);

  it("inclut les fériés fixes", () => {
    expect(h2026.get("2026-01-01")).toBe("Jour de l'an");
    expect(h2026.get("2026-05-01")).toBe("Fête du Travail");
    expect(h2026.get("2026-07-14")).toBe("Fête nationale");
    expect(h2026.get("2026-12-25")).toBe("Noël");
  });

  it("inclut les fériés mobiles (basés sur Pâques 2026 = 5 avril)", () => {
    expect(h2026.get("2026-04-06")).toBe("Lundi de Pâques"); // Pâques + 1
    expect(h2026.get("2026-05-14")).toBe("Ascension"); // Pâques + 39
    expect(h2026.get("2026-05-25")).toBe("Lundi de Pentecôte"); // Pâques + 50
  });
});

describe("getMonthDays", () => {
  it("annote week-ends et fériés (juillet 2026)", () => {
    const days = getMonthDays("2026-07");
    expect(days).toHaveLength(31);

    const bastille = days.find((d) => d.iso === "2026-07-14")!;
    expect(bastille.holiday).toBe("Fête nationale");
    expect(bastille.defaultWorked).toBe(false);

    // 4 juillet 2026 est un samedi
    const sat = days.find((d) => d.iso === "2026-07-04")!;
    expect(sat.isWeekend).toBe(true);
    expect(sat.defaultWorked).toBe(false);

    // 15 juillet 2026 est un mercredi ouvré
    const wed = days.find((d) => d.iso === "2026-07-15")!;
    expect(wed.isWeekend).toBe(false);
    expect(wed.holiday).toBeNull();
    expect(wed.defaultWorked).toBe(true);
  });
});

describe("businessDaysInMonth", () => {
  it("compte les jours ouvrés hors fériés (mai 2026 a 3 fériés en semaine)", () => {
    // Mai 2026 : 1er (ven, férié), 8 (ven, férié), 14 (jeu, Ascension), 25 (lun, Pentecôte)
    // 21 jours de semaine au total - 4 fériés en semaine = 17
    expect(businessDaysInMonth("2026-05")).toBe(17);
  });

  it("juillet 2026 : 23 jours de semaine - 1 férié (14) = 22", () => {
    expect(businessDaysInMonth("2026-07")).toBe(22);
  });
});
