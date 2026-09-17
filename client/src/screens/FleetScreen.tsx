import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useData } from '../data/DataContext';
import { decorateUnit, type DecoratedUnit } from '../domain/decorate';
import { STATUS_ORDER, UNIT_TYPES, statusMeta } from '../domain/status';
import { today } from '../domain/format';
import { Card, Chip, EmptyState, StatCard, StatusPill, Tab, TabGroup } from '../components/ui';
import { colors, fonts } from '../styles/tokens';
import type { UnitStatus, UnitType } from '../domain/types';

type ViewMode = 'table' | 'cards' | 'kanban';
type StatusFilter = UnitStatus | 'all' | 'offsite';

export function FleetScreen() {
  const { t } = useI18n();
  const { units, setSelectedUnitId } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<UnitType | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('table');

  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const all = useMemo(() => units.map((u) => decorateUnit(u, t)), [units, t]);
  const total = all.length;
  const hasUnits = total > 0;

  const count = (s: UnitStatus) => all.filter((u) => u.status === s).length;
  const offsite = all.filter((u) => u.status === 'vendor' || u.status === 'parts').length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const openUnit = (id: string) => {
    setSelectedUnitId(id);
    navigate(`/units/${encodeURIComponent(id)}`);
  };

  const byType = UNIT_TYPES.map((k) => [k, all.filter((u) => u.type === k).length] as const).filter((a) => a[1] > 0);

  const stats = [
    { key: 'total', label: t.stat.total, value: total, sub: byType.length ? byType.map((a) => `${a[1]} ${a[0]}`).join(' · ') : t.stat.totalEmpty, accent: colors.blue, go: () => { setType('all'); setStatus('all'); } },
    { key: 'pending', label: t.stat.pending, value: count('reported'), sub: t.stat.pendingSub, accent: colors.yellow, go: () => { setType('all'); setStatus('reported'); } },
    { key: 'operational', label: t.stat.operational, value: count('operational'), sub: `${t.stat.avail} ${pct(count('operational'))}%`, accent: colors.green, go: () => { setType('all'); setStatus('operational'); } },
    { key: 'due', label: t.stat.due, value: count('due'), sub: `${all.filter((u) => u.next !== '-' && new Date(u.next) < today()).length} ${t.stat.overdue}`, accent: '#E8A000', go: () => { setType('all'); setStatus('due'); } },
    { key: 'offsite', label: t.stat.offsite, value: offsite, sub: `${count('parts')} ${t.stat.awaiting}`, accent: colors.textSoft, go: () => { setType('all'); setStatus('offsite'); } },
    { key: 'out', label: t.stat.out, value: count('out'), sub: t.stat.outSub, accent: colors.redStrong, go: () => { setType('all'); setStatus('out'); } },
  ];

  const matchesSearch = (u: DecoratedUnit) => {
    if (!query) return true;
    return [u.id, u.serial, u.brand, u.model, u.issueOrDash].some((v) => String(v).toLowerCase().includes(query));
  };

  const rows = all.filter(
    (u) => (type === 'all' || u.type === type) && (status === 'all' || u.status === status || (status === 'offsite' && (u.status === 'vendor' || u.status === 'parts'))) && matchesSearch(u),
  );

  const groups = UNIT_TYPES.map((k) => {
    const groupUnits = rows.filter((u) => u.type === k);
    return { key: k, name: t.plural[k], count: groupUnits.length, ok: groupUnits.filter((u) => u.status === 'operational').length, units: groupUnits };
  }).filter((g) => g.count > 0);

  const meta = statusMeta(t);
  const kanban = STATUS_ORDER.map((s) => ({ key: s, label: meta[s].label, fg: meta[s].fg, units: rows.filter((u) => u.status === s) }));

  return (
    <ScreenGate screen="fleet">
      <AppShell screen="fleet">
        {!hasUnits ? (
          <EmptyState
            title={t.fleetEmpty.title}
            body={t.fleetEmpty.body}
            action={
              <button
                onClick={() => navigate('/add')}
                style={{ height: 38, padding: '0 20px', borderRadius: 3, border: 'none', background: colors.yellow, color: colors.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
              >
                {t.fleetEmpty.button}
              </button>
            }
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 14 }}>
              {stats.map((s) => (
                <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} accent={s.accent} onClick={s.go} />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Chip label={t.allTypes} active={type === 'all'} onClick={() => setType('all')} />
              {UNIT_TYPES.map((k) => (
                <Chip key={k} label={t.plural[k]} active={type === k} onClick={() => setType(k)} />
              ))}
              <span style={{ width: 1, height: 20, background: colors.border, margin: '0 6px' }} />
              <Chip label={t.anyStatus} active={status === 'all'} onClick={() => setStatus('all')} />
              <Chip label={t.st.reported} active={status === 'reported'} onClick={() => setStatus('reported')} />
              <Chip label={t.st.operational} active={status === 'operational'} onClick={() => setStatus('operational')} />
              <Chip label={t.stat.due} active={status === 'due'} onClick={() => setStatus('due')} />
              <Chip label={t.stat.offsite} active={status === 'offsite'} onClick={() => setStatus('offsite')} />
              <Chip label={t.st.out} active={status === 'out'} onClick={() => setStatus('out')} />
              <div style={{ flex: 1 }} />
              <TabGroup>
                <Tab label={t.view.table} active={view === 'table'} onClick={() => setView('table')} />
                <Tab label={t.view.cards} active={view === 'cards'} onClick={() => setView('cards')} />
                <Tab label={t.view.kanban} active={view === 'kanban'} onClick={() => setView('kanban')} />
              </TabGroup>
            </div>

            {view === 'table' && (
              <Card padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 100px minmax(110px,1fr) 130px 90px 70px 150px 100px 95px minmax(110px,1fr)', gap: 10, padding: '9px 18px', borderBottom: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                  <div>{t.fleetTable.id}</div>
                  <div>{t.fleetTable.type}</div>
                  <div>{t.fleetTable.brandModel}</div>
                  <div>{t.fleetTable.serial}</div>
                  <div>{t.fleetTable.zone}</div>
                  <div>{t.fleetTable.hours}</div>
                  <div>{t.fleetTable.status}</div>
                  <div>{t.fleetTable.next}</div>
                  <div>{t.fleetTable.costToDate}</div>
                  <div>{t.fleetTable.currentIssue}</div>
                </div>
                {rows.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => openUnit(u.id)}
                    style={{ display: 'grid', gridTemplateColumns: '60px 100px minmax(110px,1fr) 130px 90px 70px 150px 100px 95px minmax(110px,1fr)', gap: 10, padding: '10px 18px', borderBottom: `1px solid ${colors.divider}`, alignItems: 'center', cursor: 'pointer', background: '#fff', fontSize: 12.5, color: colors.textBody }}
                  >
                    <div style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.blue, letterSpacing: '0.04em' }}>{u.id}</div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.typeName}</div>
                    <div style={{ color: colors.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.brand} {u.model}</div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.serial}</div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.zone}</div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{u.hoursFmt}</div>
                    <StatusPill bg={u.badgeBg} fg={u.badgeFg} label={u.statusLabel} />
                    <div style={{ color: u.nextColor, fontWeight: u.nextWeight, whiteSpace: 'nowrap' }}>{u.nextFmt}</div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 11.5, whiteSpace: 'nowrap' }}>{u.costToDateShort}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textSoft }}>{u.issueOrDash}</div>
                  </div>
                ))}
                <div style={{ padding: '10px 18px', fontSize: 11, color: colors.textMuted }}>{t.fleetTable.assetsOf(rows.length, total)}</div>
              </Card>
            )}

            {view === 'cards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {groups.map((g) => (
                  <div key={g.key}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16 }}>{g.name}</div>
                      <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSoft, letterSpacing: '0.06em' }}>
                        {g.count} UNITS · {g.ok} OPERATIONAL
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 12 }}>
                      {g.units.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => openUnit(u.id)}
                          style={{ textAlign: 'left', background: '#fff', borderRadius: 6, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: fonts.mono, fontSize: 14, fontWeight: 700, color: colors.blue }}>{u.id}</span>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: u.badgeFg }} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{u.brand} {u.model}</div>
                          <div style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.textMuted }}>{u.serial}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: colors.textSoft }}>
                            <span>{u.zone}</span>
                            <span style={{ fontFamily: fonts.mono }}>{u.hoursFmt} {u.hoursUnit}</span>
                          </div>
                          <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                            <span style={{ color: u.badgeFg, fontWeight: 600 }}>{u.statusLabel}</span>
                            <span style={{ fontFamily: fonts.mono, color: colors.textSoft }}>{u.costToDateShort}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.cardSub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'kanban' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 12, alignItems: 'start' }}>
                {kanban.map((col) => (
                  <div key={col.key} style={{ background: colors.divider, borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: colors.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.fg, flexShrink: 0 }} />
                        {col.label}
                      </span>
                      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSoft, flexShrink: 0, marginLeft: 6 }}>{col.units.length}</span>
                    </div>
                    {col.units.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => openUnit(u.id)}
                        style={{ textAlign: 'left', background: '#fff', borderRadius: 6, border: `1px solid ${colors.border}`, padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.blue }}>{u.id}</span>
                          <span style={{ fontSize: 10.5, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 6 }}>{u.zone}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>{u.brand} {u.model}</div>
                        <div style={{ fontSize: 11, color: colors.textSoft, lineHeight: 1.4 }}>{u.cardSub}</div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AppShell>
    </ScreenGate>
  );
}
