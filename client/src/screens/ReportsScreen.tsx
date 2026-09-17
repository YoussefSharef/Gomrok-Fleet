import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useData } from '../data/DataContext';
import { decorateUnit } from '../domain/decorate';
import { UNIT_TYPES } from '../domain/status';
import { currentYearStart, daysFmt, egpK, num, today } from '../domain/format';
import { Btn, Card } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

export function ReportsScreen() {
  const { t } = useI18n();
  const { units, vendors } = useData();
  const navigate = useNavigate();

  const all = useMemo(() => units.map((u) => decorateUnit(u, t)), [units, t]);
  const yearStart = currentYearStart();
  const now = today();

  const count = (s: string) => all.filter((u) => u.status === s).length;
  const total = all.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const wos = all.filter((u) => u.issue);
  const offsite = all.filter((u) => u.status === 'vendor' || u.status === 'parts').length;

  const downtimeRows = UNIT_TYPES.map((ty) => ({ type: t.plural[ty], hours: all.filter((u) => u.type === ty).reduce((a, u) => a + u.downDays, 0) })).filter((d) => d.hours > 0);
  const maxD = downtimeRows.reduce((a, d) => Math.max(a, d.hours), 0) || 1;
  const downtime = downtimeRows.map((d) => ({ ...d, pct: Math.round((d.hours / maxD) * 100) }));
  const totalDown = downtimeRows.reduce((a, d) => a + d.hours, 0);
  const worst = downtimeRows.slice().sort((a, b) => b.hours - a.hours)[0];
  const downtimeNote = worst && totalDown ? t.downNote(worst.type, Math.round((worst.hours / totalDown) * 100)) : t.downEmpty;

  const vendorSpend = vendors.map((v) => {
    const hist = all.reduce<number[]>((acc, u) => acc.concat(u.hist.filter((h) => h.vendor === v.name && h.wo !== '-' && h.date >= yearStart).map((h) => h.cost || 0)), []);
    return { name: v.name, val: hist.reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.val - a.val);
  const maxS = vendorSpend.length ? vendorSpend[0].val || 1 : 1;
  const spendByVendor = vendorSpend.map((s) => ({ ...s, fmt: num(s.val), pct: Math.round((s.val / maxS) * 100) }));

  const totalSpend = all.reduce((a, u) => a + u.costYtd, 0);
  const wf = all.filter((u) => u.mtbf);

  const reportStats = [
    { label: t.rep.downtime, value: `${num(totalDown)} ${t.days}`, sub: t.rep.downtimeSub, accent: colors.redStrong },
    { label: t.rep.spend, value: egpK(totalSpend), sub: `${t.rep.spendSub} ${egpK(wos.reduce((a, u) => a + (u.cost || 0), 0))}`, accent: colors.yellow },
    { label: t.rep.avail, value: `${pct(count('operational'))}%`, sub: t.rep.availSub, accent: colors.green },
    { label: t.rep.mtbf, value: wf.length ? daysFmt(t, Math.round(wf.reduce((a, u) => a + (u.mtbf || 0), 0) / wf.length)) : '-', sub: `${wf.length} ${t.rep.mtbfSub}`, accent: colors.blue },
    { label: t.rep.openWo, value: String(wos.length), sub: `${offsite} ${t.rep.offsite}`, accent: colors.textSoft },
  ];

  const costRows = all
    .slice()
    .sort((a, b) => b.costToDate - a.costToDate)
    .slice(0, 10)
    .map((r) => ({ ...r, age: r.ageDays == null ? '-' : daysFmt(t, r.ageDays), down: r.downDays, repairs: r.faults }));

  const exportCsv = () => {
    const header = [t.reportsScreen.costTable.unit, t.reportsScreen.costTable.brandModel, t.reportsScreen.costTable.serial, t.reportsScreen.costTable.age, t.reportsScreen.costTable.faults, t.reportsScreen.costTable.mtbf, t.reportsScreen.costTable.downtime, t.reportsScreen.costTable.costYtd, t.reportsScreen.costTable.costToDate];
    const rows = costRows.map((r) => [r.id, `${r.brand} ${r.model}`, r.serial, r.age, r.repairs, r.mtbfFmt, `${r.down} h`, r.costYtdFmt, r.costToDateFmt]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gomrok-cost-report-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ScreenGate screen="reports">
      <AppShell screen="reports">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: colors.textSoft }}>{t.reportsScreen.periodLabel}</span>
            <span style={{ height: 30, padding: '0 12px', borderRadius: 3, border: `1.5px solid ${colors.border}`, background: '#fff', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {t.reportsScreen.ytdBadge(t.months[0], t.months[now.getMonth()], now.getFullYear())}
            </span>
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" style={{ borderColor: colors.blue }} onClick={exportCsv}>{t.reportsScreen.exportCsv}</Btn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
            {reportStats.map((s) => (
              <Card key={s.label} accent={s.accent} padding="14px 16px">
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 800, color: colors.blue, lineHeight: 1, whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 5 }}>{s.sub}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Card padding="18px 22px">
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.reportsScreen.downtimeTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 14 }}>{t.reportsScreen.downtimeSub}</div>
              {downtime.map((d) => (
                <div key={d.type} style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) 70px', gap: 12, alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: 12.5, color: colors.textBody }}>{d.type}</span>
                  <div style={{ height: 18, background: colors.divider, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: colors.blue }} />
                  </div>
                  <span style={{ fontFamily: fonts.mono, fontSize: 12, textAlign: 'right' }}>{d.hours} h</span>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.divider}`, fontSize: 11.5, color: colors.textSoft }}>{downtimeNote}</div>
            </Card>
            <Card padding="18px 22px">
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.reportsScreen.spendTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 14 }}>{t.reportsScreen.spendSub}</div>
              {spendByVendor.map((d) => (
                <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 90px', gap: 12, alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: 12.5, color: colors.textBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <div style={{ height: 18, background: colors.divider, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: colors.yellow }} />
                  </div>
                  <span style={{ fontFamily: fonts.mono, fontSize: 12, textAlign: 'right' }}>{d.fmt}</span>
                </div>
              ))}
            </Card>
          </div>

          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.reportsScreen.costTableTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted }}>{t.reportsScreen.costTableSub}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px minmax(0,1fr) 140px 70px 70px 130px 90px 105px 115px', gap: 12, padding: '9px 18px', borderBottom: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
              <div>{t.reportsScreen.costTable.unit}</div>
              <div>{t.reportsScreen.costTable.brandModel}</div>
              <div>{t.reportsScreen.costTable.serial}</div>
              <div>{t.reportsScreen.costTable.age}</div>
              <div>{t.reportsScreen.costTable.faults}</div>
              <div>{t.reportsScreen.costTable.mtbf}</div>
              <div>{t.reportsScreen.costTable.downtime}</div>
              <div style={{ textAlign: 'right' }}>{t.reportsScreen.costTable.costYtd}</div>
              <div style={{ textAlign: 'right' }}>{t.reportsScreen.costTable.costToDate}</div>
            </div>
            {costRows.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/units/${encodeURIComponent(r.id)}`)}
                style={{ display: 'grid', gridTemplateColumns: '60px minmax(0,1fr) 140px 70px 70px 130px 90px 105px 115px', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${colors.divider}`, fontSize: 12.5, color: colors.textBody, alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.blue }}>{r.id}</div>
                <div style={{ color: colors.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.brand} {r.model}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.serial}</div>
                <div>{r.age}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{r.repairs}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{r.mtbfFmt}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{r.down} h</div>
                <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 12 }}>{r.costYtdFmt}</div>
                <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, color: colors.ink }}>{r.costToDateFmt}</div>
              </div>
            ))}
          </Card>
        </div>
      </AppShell>
    </ScreenGate>
  );
}
