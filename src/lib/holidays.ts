// Jours fériés français et génération de la grille de jours d'un mois.

function iso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher, grégorien). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Map ISO "YYYY-MM-DD" -> nom du jour férié français, pour une année donnée. */
export function frenchHolidays(year: number): Map<string, string> {
  const easter = easterSunday(year);
  const lundiPaques = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const lundiPentecote = addDays(easter, 50);

  const map = new Map<string, string>([
    [iso(year, 1, 1), "Jour de l'an"],
    [iso(year, 5, 1), "Fête du Travail"],
    [iso(year, 5, 8), "Victoire 1945"],
    [iso(year, 7, 14), "Fête nationale"],
    [iso(year, 8, 15), "Assomption"],
    [iso(year, 11, 1), "Toussaint"],
    [iso(year, 11, 11), "Armistice"],
    [iso(year, 12, 25), "Noël"],
    [
      iso(lundiPaques.getFullYear(), lundiPaques.getMonth() + 1, lundiPaques.getDate()),
      "Lundi de Pâques",
    ],
    [
      iso(ascension.getFullYear(), ascension.getMonth() + 1, ascension.getDate()),
      "Ascension",
    ],
    [
      iso(
        lundiPentecote.getFullYear(),
        lundiPentecote.getMonth() + 1,
        lundiPentecote.getDate()
      ),
      "Lundi de Pentecôte",
    ],
  ]);
  return map;
}

export type MonthDay = {
  iso: string; // "YYYY-MM-DD"
  day: number; // 1..31
  weekday: number; // 0 = dimanche … 6 = samedi
  isWeekend: boolean;
  holiday: string | null; // nom du férié, sinon null
  /** Ouvré et non férié : coché par défaut dans la grille. */
  defaultWorked: boolean;
};

/** Liste des jours d'un mois "YYYY-MM" avec week-ends et fériés annotés. */
export function getMonthDays(month: string): MonthDay[] {
  const [year, m] = month.split("-").map(Number);
  const holidays = frenchHolidays(year);
  const lastDay = new Date(year, m, 0).getDate();

  const days: MonthDay[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const weekday = new Date(year, m - 1, day).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const key = iso(year, m, day);
    const holiday = holidays.get(key) ?? null;
    days.push({
      iso: key,
      day,
      weekday,
      isWeekend,
      holiday,
      defaultWorked: !isWeekend && !holiday,
    });
  }
  return days;
}

/** Nombre de jours ouvrés (hors week-ends et fériés) d'un mois "YYYY-MM". */
export function businessDaysInMonth(month: string): number {
  return getMonthDays(month).filter((d) => d.defaultWorked).length;
}
