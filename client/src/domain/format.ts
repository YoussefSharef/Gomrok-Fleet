import type { Dict } from '../i18n/types';

/** The mockup froze "today" at 2026-09-17 for demo consistency; this is a
 * real app, so we use the actual current date everywhere. */
export function today(): Date {
  return new Date();
}

export function todayStr(): string {
  return today().toISOString().slice(0, 10);
}

export function fmt(t: Dict, d: string | null | undefined): string {
  if (!d || d === '-' || d === t.tbd) return d || '-';
  const p = String(d).split('-');
  if (p.length < 3) return d;
  return `${+p[2]} ${t.months[+p[1] - 1]} ${p[0]}`;
}

export function fmtShort(t: Dict, d: string | null | undefined): string {
  const p = String(d || '').split('-');
  if (p.length < 3) return d || '-';
  return `${+p[2]} ${t.months[+p[1] - 1]}`;
}

export function addDays(d: string, n: number): string {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export function addMonths(d: string, n: number): string {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x.toISOString().slice(0, 10);
}

export function num(n: number | null | undefined): string {
  return (+(n ?? 0)).toLocaleString('en-US');
}

export function egp(n: number | null | undefined): string {
  return n == null || (n as unknown) === '' ? '-' : 'EGP ' + num(n);
}

export function egpK(n: number | null | undefined): string {
  const v = n || 0;
  if (!v) return 'EGP 0';
  if (v >= 1e6) return 'EGP ' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1000) return 'EGP ' + (v / 1000).toFixed(v >= 1e5 ? 0 : 1) + 'k';
  return egp(v);
}

export function daysFmt(t: Dict, d: number | null): string {
  if (d == null) return '-';
  if (d >= 365) return (d / 365).toFixed(1) + ' ' + t.yrs;
  if (d >= 60) return Math.round(d / 30) + ' ' + t.mons;
  return d + ' ' + t.days;
}

export function daysSince(d: string | null | undefined): number {
  if (!d) return 0;
  return Math.max(0, Math.round((today().getTime() - new Date(d).getTime()) / 864e5));
}

export function currentYearStart(): string {
  return `${today().getFullYear()}-01-01`;
}

/** Localized "17 Sep 2026"-style stamp for the current date, used on
 * printed reports and the top bar instead of the mockup's frozen date. */
export function todayLong(t: Dict): string {
  const d = today();
  return `${d.getDate()} ${t.months[d.getMonth()]} ${d.getFullYear()}`;
}

export function todayWithWeekday(t: Dict): string {
  const d = today();
  const weekdayIdx = (d.getDay() + 6) % 7; // JS: Sun=0 → mockup order Mon..Sun
  return `${t.weekdays[weekdayIdx]} ${todayLong(t)}`;
}

/** "Jan – Sep 2026 (YTD)"-style range label for the current date. */
export function ytdRangeLabel(t: Dict): string {
  const d = today();
  return `${t.months[0]} – ${t.months[d.getMonth()]} ${d.getFullYear()} (YTD)`;
}
