import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n, dirOfSafe } from '../i18n';
import { useData } from '../data/DataContext';
import { decorateUnit } from '../domain/decorate';
import { buildCalendarGrid } from '../domain/calendar';
import { UNIT_TYPES } from '../domain/status';
import { today } from '../domain/format';
import { Card } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

interface DayEvent {
  label: string;
  bg: string;
  fg: string;
  unitId: string;
}

export function ScheduleScreen() {
  const { t } = useI18n();
  const { units } = useData();
  const navigate = useNavigate();

  const all = useMemo(() => units.map((u) => decorateUnit(u, t)), [units, t]);
  const now = today();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const eventsByDate = useMemo(() => {
    const map: Record<string, DayEvent[]> = {};
    const push = (date: string, ev: DayEvent) => {
      if (!date.startsWith(monthPrefix)) return;
      (map[date] = map[date] || []).push(ev);
    };
    all.forEach((u) => {
      if (u.next !== '-' && u.next !== t.notSet) {
        push(u.next, { label: `${u.id} ${t.cal.service}`, bg: u.overdue ? colors.redStrong : colors.yellow, fg: u.overdue ? '#fff' : colors.blue, unitId: u.id });
      }
      if (u.eta && u.eta.length === 10 && u.status !== 'maintenance') {
        push(u.eta, { label: `${u.id} ${t.cal.returns}`, bg: colors.blue, fg: '#fff', unitId: u.id });
      }
    });
    return map;
  }, [all, monthPrefix, t]);

  const grid = useMemo(() => buildCalendarGrid(now), [monthPrefix]);
  const todayStr = now.toISOString().slice(0, 10);

  const upcoming = useMemo(
    () =>
      all
        .filter((u) => u.next !== '-' && u.next !== t.notSet && (new Date(u.next).getTime() - now.getTime()) / 864e5 <= 45)
        .sort((a, b) => (a.next < b.next ? -1 : 1))
        .map((u) => ({ ...u, trigger: u.pct >= 75 ? `${u.hoursLabel} · ${u.hoursFmt} ${u.hoursUnit}` : t.cal.calendarTrigger })),
    [all, t],
  );

  const plans = UNIT_TYPES.map((ty) => {
    const u = all.find((x) => x.type === ty);
    return u ? { type: t.plural[ty], plan: u.plan } : null;
  }).filter((p): p is { type: string; plan: string } => !!p);

  return (
    <ScreenGate screen="schedule">
      <AppShell screen="schedule">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 18, alignItems: 'start' }}>
          <Card padding="18px 22px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 18 }}>
                {t.months[now.getMonth()]} {now.getFullYear()}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: colors.textSoft }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.yellow }} />
                  {t.schedule.legendScheduled}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.redStrong }} />
                  {t.schedule.legendOverdue}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.blue }} />
                  {t.schedule.legendReturns}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 1, background: colors.border, border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
              {t.weekdays.map((d) => (
                <div key={d} style={{ background: colors.bg, padding: '6px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                  {d}
                </div>
              ))}
              {grid.map((c, i) => {
                const isToday = c.date === todayStr;
                const isPast = c.date != null && c.date < todayStr;
                const events = c.date ? eventsByDate[c.date] || [] : [];
                return (
                  <div key={i} style={{ background: isToday ? '#FFF5B0' : isPast || !c.date ? '#FBFAF7' : '#fff', minHeight: 84, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {c.day && (
                      <div style={{ fontFamily: fonts.mono, fontSize: 11.5, color: isToday ? colors.blue : isPast ? colors.textMuted : colors.slate, fontWeight: isToday ? 700 : 400 }}>{c.day}</div>
                    )}
                    {events.map((ev, j) => (
                      <button
                        key={j}
                        onClick={() => navigate(`/units/${encodeURIComponent(ev.unitId)}`)}
                        style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 3, padding: '2px 6px', fontSize: 10.5, fontWeight: 600, background: ev.bg, color: ev.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {ev.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Card padding="18px 20px">
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.schedule.upcomingTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 12 }}>{t.schedule.upcomingSub}</div>
              {upcoming.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/units/${encodeURIComponent(u.id)}`)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: `1px solid ${colors.divider}`, padding: '10px 0', cursor: 'pointer', display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}
                >
                  <span style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.blue }}>{u.id}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: colors.ink }}>{u.brand} {u.model}</span>
                    <span dir={dirOfSafe(u.trigger)} style={{ display: 'block', fontSize: 11, color: colors.textSoft, unicodeBidi: 'isolate' }}>{u.trigger}</span>
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: u.nextColor, whiteSpace: 'nowrap' }}>{u.nextShort}</span>
                </button>
              ))}
            </Card>
            <Card padding="18px 20px">
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{t.schedule.intervalsTitle}</div>
              {plans.map((p) => (
                <div key={p.type} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderTop: `1px solid ${colors.divider}`, fontSize: 12 }}>
                  <span style={{ color: colors.textSoft, whiteSpace: 'nowrap' }}>{p.type}</span>
                  <span dir={dirOfSafe(p.plan)} style={{ fontWeight: 500, textAlign: 'right', unicodeBidi: 'isolate' }}>{p.plan}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </AppShell>
    </ScreenGate>
  );
}
