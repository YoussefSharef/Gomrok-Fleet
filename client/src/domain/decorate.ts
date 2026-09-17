import type { Dict } from '../i18n/types';
import { addMonths, currentYearStart, daysFmt, daysSince, egp, egpK, fmt, fmtShort, num, today } from './format';
import { KIND_COLORS, hoursUnit, statusMeta } from './status';
import type { Part, Quote, ServiceEvent, Unit } from './types';

export interface HistoryEntry {
  id: string;
  date: string;
  dateFmt: string;
  kind: string;
  kindRaw: ServiceEvent['kind'];
  title: string;
  desc: string;
  vendor: string;
  wo: string;
  cost: number | null;
  costFmt: string;
  costShort: string;
  dot: string;
  kindBg: string;
  kindFg: string;
  unit: string;
}

export interface DecoratedPart extends Part {
  qtyFmt: string;
  unitFmt: string;
  lineFmt: string;
  costFmt: string;
}

export interface DecoratedQuote extends Quote {
  priceFmt: string;
  leadFmt: string;
  tagBg: string;
  tagFg: string;
  tag: string;
}

export interface DecoratedUnit extends Unit {
  typeName: string;
  statusLabel: string;
  badgeBg: string;
  badgeFg: string;
  hoursFmt: string;
  hoursUnit: string;
  hoursLabel: string;
  next: string;
  nextFmt: string;
  nextShort: string;
  nextColor: string;
  nextWeight: number;
  issueOrDash: string;
  hasIssue: boolean;
  sentFmt: string;
  etaFmt: string;
  costFmt: string;
  purchasedFmt: string;
  partsDeco: DecoratedPart[];
  quotesDeco: DecoratedQuote[];
  hasQuotes: boolean;
  quoteCount: number;
  partsList: string;
  labourFmt: string;
  cardSub: string;
  plan: string;
  planIntervalHours: string;
  sinceHours: string;
  sinceLabel: string;
  pct: number;
  lastFmt: string;
  hist: HistoryEntry[];
  costToDate: number;
  costYtd: number;
  costToDateFmt: string;
  costToDateShort: string;
  costYtdFmt: string;
  faults: number;
  mtbf: number | null;
  mtbfFmt: string;
  ageDays: number | null;
  commonParts: string;
  reportedAtFmt: string;
  reporterShort: string;
  downDays: number;
  overdue: boolean;
  dueSoon: boolean;
}

export function historyOf(unit: Unit, t: Dict): HistoryEntry[] {
  const ev = unit.events.map((e) => ({ ...e }));
  const withCommission = unit.purchased
    ? ev.concat([
        {
          id: `${unit.id}-commission`,
          unitId: unit.id,
          date: unit.purchased,
          kind: 'commission' as const,
          title: t.kind.commission,
          desc: t.commissionDesc,
          vendor: unit.partner || '-',
          wo: '-',
          cost: null,
        },
      ])
    : ev;
  return withCommission
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => {
      const c = KIND_COLORS[e.kind] || KIND_COLORS.preventive;
      return {
        ...e,
        dateFmt: fmt(t, e.date),
        costFmt: egp(e.cost),
        costShort: e.cost == null ? '-' : num(e.cost),
        kind: t.kind[e.kind] || e.kind,
        kindRaw: e.kind,
        dot: c[0],
        kindBg: c[1],
        kindFg: c[2],
        unit: unit.id,
      };
    });
}

export function decorateUnit(unit: Unit, t: Dict): DecoratedUnit {
  const status = statusMeta(t)[unit.status] || statusMeta(t).operational;
  const hist = historyOf(unit, t);
  const next = unit.nextService || (unit.lastService && unit.intervalMonths ? addMonths(unit.lastService, unit.intervalMonths) : '');
  const overdue = !!next && new Date(next) < today();
  const dueSoon = !!next && !overdue && (new Date(next).getTime() - today().getTime()) / 864e5 <= 14;
  const costToDate = hist.reduce((a, e) => a + (e.cost || 0), 0);
  const yearStart = currentYearStart();
  const costYtd = hist.filter((e) => e.date >= yearStart).reduce((a, e) => a + (e.cost || 0), 0);
  const faults = hist.filter((e) => e.kindRaw === 'breakdown').length;
  const ageDays = unit.purchased ? daysSince(unit.purchased) : null;
  const mtbf = faults && ageDays ? Math.round(ageDays / faults) : null;
  const unitLabel = hoursUnit(t, unit.type);
  const iv: string[] = [];
  if (unit.intervalHours) iv.push(num(unit.intervalHours) + ' ' + unitLabel);
  if (unit.intervalMonths) iv.push(unit.intervalMonths + ' ' + t.mons);
  const lastSvc = hist.find((e) => e.kindRaw === 'preventive')?.date || unit.lastService || '';
  const since = unit.hours && unit.lastMeter ? Math.max(0, unit.hours - unit.lastMeter) : null;
  const partsSum = unit.parts.reduce((a, p) => a + p.qty * p.cost, 0);

  const partsDeco: DecoratedPart[] = unit.parts.map((p) => ({
    ...p,
    qtyFmt: 'x ' + p.qty,
    unitFmt: num(p.cost),
    lineFmt: num(p.qty * p.cost),
    costFmt: egp(p.qty * p.cost),
  }));
  const quotesDeco: DecoratedQuote[] = unit.quotes.map((q) => ({
    ...q,
    priceFmt: egp(q.price),
    leadFmt: q.lead ? q.lead + ' ' + t.days : '-',
    tagBg: q.awarded ? '#D1F0E0' : '#F2F2F0',
    tagFg: q.awarded ? '#1E7B4B' : '#6B6A62',
    tag: q.awarded ? t.q.awardedTag : t.q.notAwarded,
  }));

  const next_ = next || '-';
  const nextFmt = next ? fmt(t, next) : t.notSet;

  return {
    ...unit,
    typeName: t.types[unit.type],
    statusLabel: status.label,
    badgeBg: status.bg,
    badgeFg: status.fg,
    hoursFmt: unit.hours ? num(unit.hours) : '-',
    hoursUnit: unitLabel,
    hoursLabel: unitLabel === t.hrs ? t.hourMeter : t.cycleCount,
    next: next_,
    nextFmt,
    nextShort: next ? (overdue ? t.overdue + ' · ' + fmtShort(t, next) : fmtShort(t, next)) : t.notSet,
    nextColor: overdue ? '#C0392B' : dueSoon ? '#8B5E00' : '#4A4940',
    nextWeight: overdue || dueSoon ? 600 : 400,
    issueOrDash: unit.issue || '-',
    hasIssue: !!unit.issue,
    sentFmt: fmt(t, unit.sent),
    etaFmt: fmt(t, unit.eta),
    costFmt: egp(unit.cost),
    purchasedFmt: unit.purchased ? fmt(t, unit.purchased) : t.notSet,
    partsDeco,
    quotesDeco,
    hasQuotes: unit.quotes.length > 1,
    quoteCount: unit.quotes.length,
    partsList: unit.parts.map((p) => p.name).join(', ') || '-',
    labourFmt: unit.cost ? egp(unit.cost - partsSum) : '-',
    cardSub: unit.issue ? unit.issue : overdue ? t.overdueSince + ' ' + fmtShort(t, next) : next ? t.nextSvc + ' ' + fmtShort(t, next) : t.noPlan,
    plan: iv.length ? t.every + ' ' + iv.join(' ' + t.or + ' ') : t.noPlan,
    planIntervalHours: iv[0] || '-',
    sinceHours: since == null ? '-' : num(since),
    sinceLabel: unitLabel === t.hrs ? t.sinceHours : t.sinceCycles,
    pct: since && unit.intervalHours ? Math.min(100, Math.round((since / unit.intervalHours) * 100)) : 0,
    lastFmt: lastSvc ? fmt(t, lastSvc) : t.notSet,
    hist,
    costToDate,
    costYtd,
    costToDateFmt: egp(costToDate),
    costToDateShort: egpK(costToDate),
    costYtdFmt: egp(costYtd),
    faults,
    mtbf,
    mtbfFmt: mtbf ? daysFmt(t, mtbf) : '-',
    ageDays,
    commonParts: t.common[unit.type] || '',
    reportedAtFmt: unit.reportedAt ? fmt(t, unit.reportedAt) : '-',
    reporterShort: (unit.reporter || '').split(' - ')[0],
    downDays: unit.sent && ['vendor', 'parts', 'out', 'maintenance'].includes(unit.status) ? daysSince(unit.sent) : 0,
    overdue,
    dueSoon,
  };
}

export interface FactRow {
  k: string;
  v: string;
}

export function unitFacts(sel: DecoratedUnit, t: Dict): FactRow[] {
  return [
    { k: t.f.brand, v: sel.brand || '-' },
    { k: t.f.model, v: sel.model || '-' },
    { k: t.f.serial, v: sel.serial || '-' },
    { k: t.f.zone, v: sel.zone || '-' },
    { k: t.f.purchased, v: sel.purchasedFmt },
    { k: t.f.warranty, v: sel.warranty ? fmt(t, sel.warranty) : t.notSet },
    { k: t.f.partner, v: sel.partner || t.notSet },
    { k: t.f.age, v: sel.ageDays == null ? '-' : daysFmt(t, sel.ageDays) },
  ];
}

export interface KpiCard {
  label: string;
  value: string;
  sub: string;
  accent: string;
}

export function unitKpis(sel: DecoratedUnit, t: Dict): KpiCard[] {
  return [
    { label: t.kpi.costToDate, value: egpK(sel.costToDate), sub: t.kpi.costToDateSub, accent: '#184478' },
    { label: t.kpi.costYtd, value: egpK(sel.costYtd), sub: sel.hasIssue ? `${t.kpi.inclQuote} ${egpK(sel.cost)}` : t.kpi.thisYear, accent: '#FFD203' },
    { label: t.kpi.faults, value: String(sel.faults), sub: sel.hasIssue ? t.kpi.oneOpen : t.kpi.noneOpen, accent: '#C0392B' },
    { label: t.kpi.mtbf, value: sel.mtbfFmt, sub: sel.mtbf ? `${t.kpi.over} ${daysFmt(t, sel.ageDays)}` : t.kpi.noFaults, accent: '#1E7B4B' },
  ];
}

export interface PlanRow {
  k: string;
  v: string;
  color: string;
}

export function unitPlanRows(sel: DecoratedUnit, t: Dict): PlanRow[] {
  return [
    { k: t.p.plan, v: sel.plan, color: '#111110' },
    { k: t.p.interval, v: sel.planIntervalHours, color: '#111110' },
    { k: t.p.last, v: sel.lastFmt, color: '#111110' },
    { k: t.p.next, v: sel.nextFmt, color: sel.nextColor },
    { k: sel.sinceLabel, v: sel.sinceHours === '-' ? '-' : `${sel.sinceHours} / ${sel.planIntervalHours} (${sel.pct}%)`, color: '#111110' },
    { k: sel.hoursLabel, v: `${sel.hoursFmt} ${sel.hoursUnit}`, color: '#111110' },
  ];
}

export function reportNotes(sel: DecoratedUnit, t: Dict): string[] {
  return t.notes({
    hasIssue: sel.hasIssue,
    statusLabel: sel.statusLabel,
    wo: sel.wo || '',
    vendor: sel.vendor || '',
    etaFmt: sel.etaFmt,
    next: sel.next,
    nextFmt: sel.nextFmt,
    faults: sel.faults,
    ageDays: sel.ageDays,
    costToDateFmt: sel.costToDateFmt,
    partner: sel.partner,
  });
}
