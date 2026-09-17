import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useData } from '../data/DataContext';
import { decorateUnit } from '../domain/decorate';
import { currentYearStart, egpK } from '../domain/format';
import { Btn, Card, Chip, Field, TextArea, TextInput } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

export function VendorsScreen() {
  const { t } = useI18n();
  const { units, vendors, createVendor } = useData();
  const navigate = useNavigate();
  const { name } = useParams();
  const [addingVendor, setAddingVendor] = useState(false);
  const [form, setForm] = useState({ name: '', covers: '', contract: t.contracts[0], contact: '', role: '', phone: '', email: '', offers: '' });
  const [error, setError] = useState('');

  const all = useMemo(() => units.map((u) => decorateUnit(u, t)), [units, t]);
  const wos = all.filter((u) => u.issue);
  const yearStart = currentYearStart();

  const vendorRows = useMemo(
    () =>
      vendors.map((v) => {
        const mine = wos.filter((u) => u.vendor === v.name);
        const covered = all.filter((u) => u.partner === v.name);
        const hist = all
          .reduce<typeof all[number]['hist']>((acc, u) => acc.concat(u.hist.filter((h) => h.vendor === v.name && h.wo !== '-')), [])
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        const ytd = hist.filter((h) => h.date >= yearStart);
        const spendN = ytd.reduce((a, h) => a + (h.cost || 0), 0);
        const lifeN = hist.reduce((a, h) => a + (h.cost || 0), 0);
        const tagBg = v.contract === t.contracts[2] ? colors.paleBlue : v.contract === t.contracts[0] ? colors.greenBg : colors.divider;
        const tagFg = v.contract === t.contracts[2] ? colors.blue : v.contract === t.contracts[0] ? colors.green : colors.slate;
        return {
          ...v,
          unitsOut: mine.filter((u) => u.status !== 'maintenance').length,
          openWo: mine.length,
          turnaround: v.turnaround || '-',
          spend: egpK(spendN),
          lifetime: egpK(lifeN),
          openQuotes: egpK(mine.reduce((a, u) => a + (u.cost || 0), 0)),
          woCount: ytd.length,
          avgWo: ytd.length ? egpK(Math.round(spendN / ytd.length)) : '-',
          contactName: v.contact || '-',
          initials: (v.contact || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
          units: covered,
          unitCount: covered.length,
          history: hist.slice(0, 8),
          tagBg,
          tagFg,
        };
      }),
    [vendors, all, wos, yearStart, t],
  );

  const selectedVendor = name ? vendorRows.find((v) => v.name === decodeURIComponent(name)) : null;

  const workOrders = wos.slice().sort((a, b) => (a.sent && b.sent ? (a.sent < b.sent ? -1 : 1) : 0));
  const todayStr = new Date().toISOString().slice(0, 10);

  const saveVendor = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Enter a company name.');
      return;
    }
    try {
      await createVendor({ ...form, name: form.name.trim(), offers: form.offers.split('\n').map((s) => s.trim()).filter(Boolean) });
      setForm({ name: '', covers: '', contract: t.contracts[0], contact: '', role: '', phone: '', email: '', offers: '' });
      setAddingVendor(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this company.');
    }
  };

  if (selectedVendor) {
    return (
      <ScreenGate screen="vendors">
        <AppShell screen="vendors">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button onClick={() => navigate('/vendors')} style={{ alignSelf: 'flex-start', fontSize: 12, color: colors.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              {t.vendors.allCompaniesBack}
            </button>
            <Card padding="20px 24px" style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 22 }}>{selectedVendor.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: selectedVendor.tagBg, color: selectedVendor.tagFg, whiteSpace: 'nowrap' }}>{selectedVendor.contract}</span>
                </div>
                <div style={{ fontSize: 13, color: colors.textSoft }}>
                  {selectedVendor.covers} · {t.vendors.partnerSince} {selectedVendor.since ?? '-'} · {t.vendors.avgTurnaround} {selectedVendor.turnaround}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn variant="secondary" style={{ borderColor: colors.blue }}>{t.vendors.editDetailsBtn}</Btn>
                <Btn variant="primary" onClick={() => navigate('/log')}>{t.vendors.newWorkOrderBtn}</Btn>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18, alignItems: 'start' }}>
              <Card padding="18px 20px">
                <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t.vendors.ourContactTitle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.paleBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.blue, flexShrink: 0 }}>{selectedVendor.initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedVendor.contactName}</div>
                    <div style={{ fontSize: 12, color: colors.textSoft }}>{selectedVendor.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${colors.divider}`, fontSize: 12 }}>
                  <span style={{ color: colors.textMuted }}>{t.vendors.phoneLabel}</span>
                  <span style={{ fontFamily: fonts.mono }}>{selectedVendor.phone || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${colors.divider}`, fontSize: 12, gap: 8 }}>
                  <span style={{ color: colors.textMuted }}>{t.vendors.emailLabel}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedVendor.email || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${colors.divider}`, fontSize: 12 }}>
                  <span style={{ color: colors.textMuted }}>{t.vendors.escalationLabel}</span>
                  <span>{selectedVendor.escalation || '-'}</span>
                </div>
              </Card>
              <Card padding="18px 20px">
                <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t.vendors.offersTermsTitle}</div>
                {selectedVendor.offers.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: `1px solid ${colors.divider}`, fontSize: 12.5, lineHeight: 1.45 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.yellow, flexShrink: 0, marginTop: 6 }} />
                    <span>{o}</span>
                  </div>
                ))}
              </Card>
              <div style={{ background: colors.blue, borderRadius: 6, padding: '18px 20px', color: '#fff' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.yellow, marginBottom: 10 }}>{t.vendors.moneySpentTitle}</div>
                <div style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{selectedVendor.spend}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', margin: '4px 0 14px' }}>{t.vendors.ytdInclQuotes}</div>
                {[
                  [t.vendors.lifetimeSpend, selectedVendor.lifetime],
                  [t.vendors.openQuotesLabel, selectedVendor.openQuotes],
                  [t.vendors.woCountLabel, String(selectedVendor.woCount)],
                  [t.vendors.avgWoLabel, selectedVendor.avgWo],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{k}</span>
                    <span style={{ fontFamily: fonts.mono }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 18, alignItems: 'start' }}>
              <Card padding={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.vendors.woHistoryTitle}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 60px minmax(0,1.5fr) 110px 100px', gap: 12, padding: '9px 18px', borderBottom: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                  <div>{t.vendors.historyTable.date}</div>
                  <div>{t.vendors.historyTable.unit}</div>
                  <div>{t.vendors.historyTable.work}</div>
                  <div>{t.vendors.historyTable.wo}</div>
                  <div style={{ textAlign: 'right' }}>{t.vendors.historyTable.cost}</div>
                </div>
                {selectedVendor.history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => navigate(`/units/${encodeURIComponent(h.unit)}`)}
                    style={{ display: 'grid', gridTemplateColumns: '100px 60px minmax(0,1.5fr) 110px 100px', gap: 12, padding: '9px 18px', borderBottom: `1px solid ${colors.divider}`, fontSize: 12, color: colors.textBody, alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>{h.dateFmt}</div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.blue, fontWeight: 700 }}>{h.unit}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.desc}</div>
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.blue }}>{h.wo}</div>
                    <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 11 }}>{h.costFmt}</div>
                  </div>
                ))}
              </Card>
              <Card padding="18px 20px">
                <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.vendors.equipmentCareTitle}</div>
                <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 12 }}>{selectedVendor.unitCount} {t.vendors.assetsCountSuffix}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedVendor.units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/units/${encodeURIComponent(u.id)}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 9px', borderRadius: 3, border: `1px solid ${colors.border}`, background: '#fff', cursor: 'pointer', fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: colors.blue }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.badgeFg }} />
                      {u.id}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </AppShell>
      </ScreenGate>
    );
  }

  return (
    <ScreenGate screen="vendors">
      <AppShell screen="vendors">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
            {vendorRows.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(`/vendors/${encodeURIComponent(v.name)}`)}
                style={{ textAlign: 'left', background: '#fff', borderRadius: 6, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{v.name}</div>
                    <div style={{ fontSize: 11.5, color: colors.textSoft, marginTop: 2, lineHeight: 1.4 }}>{v.covers}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: v.tagBg, color: v.tagFg, whiteSpace: 'nowrap', flexShrink: 0 }}>{v.contract}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, borderTop: `1px solid ${colors.divider}`, paddingTop: 10 }}>
                  {[
                    [v.unitsOut, t.vendors.offsite],
                    [v.openWo, t.vendors.openWo],
                    [v.turnaround, t.vendors.turnaroundLabel],
                  ].map(([val, label]) => (
                    <div key={label}>
                      <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 800, color: colors.blue, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: colors.textSoft, borderTop: `1px solid ${colors.divider}`, paddingTop: 8 }}>
                  <span>{t.vendors.spendYtd}</span>
                  <span style={{ fontFamily: fonts.mono, color: colors.slate, fontWeight: 600 }}>{v.spend}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: colors.textSoft }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.contactName}</span>
                  <span style={{ fontFamily: fonts.mono, whiteSpace: 'nowrap' }}>{v.phone}</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => setAddingVendor((s) => !s)}
              style={{ background: colors.bg, borderRadius: 6, border: `1.5px dashed ${colors.borderStrong}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', minHeight: 180, color: colors.blue }}
            >
              <span style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.vendors.addCompanyTitle}</span>
              <span style={{ fontSize: 11, color: colors.textMuted }}>{t.vendors.addCompanySub}</span>
            </button>
          </div>

          {addingVendor && (
            <Card padding="22px 26px" style={{ boxShadow: colors.cardShadowHover, maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 17 }}>{t.vendors.addForm.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label={t.vendors.addForm.name}>
                  <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t.vendors.addForm.namePh} />
                </Field>
                <Field label={t.vendors.addForm.covers}>
                  <TextInput value={form.covers} onChange={(e) => setForm((f) => ({ ...f, covers: e.target.value }))} placeholder={t.vendors.addForm.coversPh} />
                </Field>
              </div>
              <Field label={t.vendors.addForm.arrangement}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.contracts.map((c) => (
                    <Chip key={c} label={c} active={form.contract === c} onClick={() => setForm((f) => ({ ...f, contract: c }))} />
                  ))}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                <Field label={t.vendors.addForm.contact}>
                  <TextInput value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
                </Field>
                <Field label={t.vendors.addForm.role}>
                  <TextInput value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder={t.vendors.addForm.rolePh} />
                </Field>
                <Field label={t.vendors.addForm.phone}>
                  <TextInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder={t.vendors.addForm.phonePh} style={{ fontFamily: fonts.mono }} />
                </Field>
                <Field label={t.vendors.addForm.email}>
                  <TextInput value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </Field>
              </div>
              <Field label={t.vendors.addForm.offers} hint={t.vendors.addForm.offersHint}>
                <TextArea rows={3} value={form.offers} onChange={(e) => setForm((f) => ({ ...f, offers: e.target.value }))} placeholder={t.vendors.addForm.offersPh} />
              </Field>
              {error && <div style={{ color: colors.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
                <Btn variant="secondary" onClick={() => setAddingVendor(false)}>{t.vendors.addForm.cancel}</Btn>
                <Btn variant="primary" onClick={saveVendor}>{t.vendors.addForm.save}</Btn>
              </div>
            </Card>
          )}

          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.vendors.openWorkOrdersTitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 60px 1.3fr 1.2fr 150px 90px 100px 90px', gap: 12, padding: '9px 18px', borderBottom: `1px solid ${colors.border}`, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
              <div>{t.vendors.woTable.wo}</div>
              <div>{t.vendors.woTable.unit}</div>
              <div>{t.vendors.woTable.fault}</div>
              <div>{t.vendors.woTable.parts}</div>
              <div>{t.vendors.woTable.handledBy}</div>
              <div>{t.vendors.woTable.sent}</div>
              <div>{t.vendors.woTable.expected}</div>
              <div style={{ textAlign: 'right' }}>{t.vendors.woTable.cost}</div>
            </div>
            {workOrders.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate(`/units/${encodeURIComponent(w.id)}`)}
                style={{ display: 'grid', gridTemplateColumns: '110px 60px 1.3fr 1.2fr 150px 90px 100px 90px', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${colors.divider}`, alignItems: 'center', fontSize: 12.5, color: colors.textBody, cursor: 'pointer' }}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.blue, fontWeight: 700 }}>{w.wo}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{w.id}</div>
                <div style={{ color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.issue}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.partsList}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.vendor}</div>
                <div style={{ whiteSpace: 'nowrap' }}>{w.sentFmt}</div>
                <div style={{ color: !w.eta || w.eta < todayStr ? colors.redStrong : colors.textBody, whiteSpace: 'nowrap' }}>{w.etaFmt}</div>
                <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 11.5 }}>{w.costFmt}</div>
              </div>
            ))}
          </Card>
        </div>
      </AppShell>
    </ScreenGate>
  );
}
