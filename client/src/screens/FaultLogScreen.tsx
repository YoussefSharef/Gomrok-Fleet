import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n, dirOfSafe } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { decorateUnit } from '../domain/decorate';
import { makeQrSvg } from '../domain/qr';
import { QR_BASE } from '../domain/status';
import { addDays, egp, fmt } from '../domain/format';
import { Btn, Card, Chip, Field, Select, TextArea, TextInput } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

type Stage = 'ops' | 'eng';
type Decision = 'approve' | 'reject';

interface Quote {
  company: string;
  scope: string;
  price: string;
  lead: string;
  note: string;
}

const blankQuotes = (scope: string): Quote[] => [0, 1, 2].map(() => ({ company: '', scope, price: '', lead: '', note: '' }));

export function FaultLogScreen() {
  const { t } = useI18n();
  const { person } = useAuth();
  const { units, people, reportFault, reviewFault } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const all = useMemo(() => units.map((u) => decorateUnit(u, t)), [units, t]);
  const pending = all.filter((u) => u.status === 'reported');

  const [stage, setStage] = useState<Stage>('ops');
  const [faultUnitId, setFaultUnitId] = useState<string | null>(searchParams.get('unit'));
  const [reporter, setReporter] = useState('');
  const [channel, setChannel] = useState(t.channels[0]);
  const [impact, setImpact] = useState(t.impacts[0]);
  const [stopped, setStopped] = useState(t.stopYes);
  const [complaint, setComplaint] = useState('');

  const [engSelId, setEngSelId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>('approve');
  const [engineer, setEngineer] = useState('');
  const [severity, setSeverity] = useState(t.sev[2][0]);
  const [faultCat, setFaultCat] = useState(t.cats[0]);
  const [sendOut, setSendOut] = useState(true);
  const [parts, setParts] = useState<{ name: string; qty: string; cost: string }[]>([]);
  const [draft, setDraft] = useState({ name: '', qty: '1', cost: '' });
  const [quotes, setQuotes] = useState<Quote[]>(blankQuotes(t.scopes[0]));
  const [award, setAward] = useState(0);
  const [woDraft, setWoDraft] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const faultSel = all.find((u) => u.id === faultUnitId) || all[0] || null;
  const engU = all.find((u) => u.id === engSelId) || pending[0] || null;

  useEffect(() => {
    if (!faultUnitId && all.length) setFaultUnitId(all[0].id);
  }, [all, faultUnitId]);

  const qrSvg = useMemo(() => (faultSel ? makeQrSvg(QR_BASE + faultSel.id) : ''), [faultSel]);

  const reporterOptions = people.filter((p) => p.role === 'operator' || p.role === 'ops');
  const engineerOptions = people.filter((p) => p.role === 'engineer' || p.role === 'admin');

  const faultFacts = faultSel
    ? [
        [t.f.serial, faultSel.serial || '-'],
        [t.f.zone, faultSel.zone || '-'],
        [t.f.status, faultSel.statusLabel],
        [t.f.partner, faultSel.partner || t.notSet],
        [t.f.warranty, faultSel.warranty ? (new Date(faultSel.warranty) > new Date() ? t.active : t.expired) : t.notSet],
        [t.kpi.costToDate, faultSel.costToDateFmt],
        [t.kpi.mtbf, faultSel.mtbfFmt],
      ]
    : [];

  const submitOps = async () => {
    if (!faultSel) return;
    await reportFault(faultSel.id, { complaint: complaint.trim() || t.defaultComplaint, reporter: reporter || t.notSet, channel, impact });
    setEngSelId(faultSel.id);
    setStage('eng');
    setComplaint('');
  };

  const addPart = () => {
    if (!draft.name.trim()) return;
    setParts((p) => p.concat([{ ...draft, name: draft.name.trim() }]));
    setDraft({ name: '', qty: '1', cost: '' });
  };

  const qFilled = quotes.map((q, i) => ({ ...q, i, priceN: +String(q.price).replace(/[^\d.]/g, '') || 0, leadN: parseInt(q.lead) || 0 })).filter((q) => q.company.trim());
  const cheapest = qFilled.slice().sort((a, b) => (a.priceN || 1e12) - (b.priceN || 1e12))[0];
  const fastest = qFilled.slice().sort((a, b) => (a.leadN || 999) - (b.leadN || 999))[0];
  const awarded = qFilled.find((q) => q.i === award) || qFilled[0] || null;

  const newStatus = sendOut ? 'vendor' : 'maintenance';
  const engNext = decision === 'reject' ? 'operational' : newStatus;
  const statusColors: Record<string, [string, string]> = {
    vendor: [colors.divider, colors.slate],
    maintenance: [colors.paleBlue, colors.blue],
    operational: [colors.greenBg, colors.green],
  };
  const [engStatusBg, engStatusFg] = statusColors[engNext] || statusColors.operational;

  const resetReviewForm = () => {
    setParts([]);
    setQuotes(blankQuotes(t.scopes[0]));
    setAward(0);
    setWoDraft('');
    setDecision('approve');
    setRejectNote('');
    setSeverity(t.sev[2][0]);
    setFaultCat(t.cats[0]);
    setEngineer('');
  };

  const submitReview = async () => {
    if (!engU) return;
    await reviewFault(engU.id, {
      decision,
      sendOut,
      wo: woDraft,
      parts: parts.map((p) => ({ name: p.name, qty: parseInt(p.qty) || 1, cost: parseFloat(String(p.cost).replace(/[^\d.]/g, '')) || 0 })),
      quotes: qFilled.map((q) => ({ company: q.company, scope: q.scope, price: q.priceN, lead: q.leadN, note: q.note, awarded: q.i === award })),
      fallbackVendor: t.notSet,
      inHouseName: t.inHouseName,
      defaultPartName: t.unspecifiedPart,
      defaultComplaint: t.defaultComplaint,
      confirmedPrefix: t.confirmed,
    });
    const rest = pending.filter((x) => x.id !== engU.id);
    resetReviewForm();
    if (rest.length) {
      setEngSelId(rest[0].id);
    } else {
      navigate(`/units/${encodeURIComponent(engU.id)}`);
    }
  };

  return (
    <ScreenGate screen="log">
      <AppShell screen="log">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['ops', 'eng'] as Stage[]).map((s, i) => {
              const active = stage === s;
              const label = s === 'ops' ? t.log.stageOpsLabel : t.log.stageEngLabel;
              const sub = s === 'ops' ? t.log.stageOpsSub : t.log.stageEngSub;
              const count = s === 'eng' ? pending.length : 0;
              return (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  style={{ flex: 1, textAlign: 'left', padding: '14px 16px', borderRadius: 6, border: `1.5px solid ${active ? colors.blue : colors.border}`, background: active ? colors.paleBlue : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, background: active ? colors.blue : colors.border, color: active ? colors.yellow : colors.textSoft }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: colors.ink }}>{label}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: colors.textSoft, marginTop: 2 }}>{sub}</span>
                  </span>
                  {!!count && <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, background: colors.yellow, color: colors.blue, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap' }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {stage === 'ops' && faultSel && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,680px) 300px', gap: 18, alignItems: 'start' }}>
              <Card padding="24px 28px" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 17 }}>{t.log.opsForm.title}</div>
                  <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 3 }}>{t.log.opsForm.stepOf}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label={t.log.opsForm.equipment}>
                    <Select value={faultSel.id} onChange={(e) => setFaultUnitId(e.target.value)}>
                      {all.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.id} - {u.brand} {u.model}{u.zone ? ` (${u.zone})` : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={`${faultSel.hoursLabel} ${t.log.opsForm.hoursAtFault}`}>
                    <TextInput value={faultSel.hoursFmt} readOnly style={{ fontFamily: fonts.mono, background: colors.bg }} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <Field label={t.log.opsForm.reportedBy} hint={t.log.opsForm.reportedByHint}>
                    <Select value={reporter} onChange={(e) => setReporter(e.target.value)}>
                      <option value="">{t.log.opsForm.pickReporter}</option>
                      {reporterOptions.map((p) => (
                        <option key={p.id} value={`${p.name} - ${p.title || t.roles[p.role]}`}>
                          {p.name} - {p.title || t.roles[p.role]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.log.opsForm.howReported}>
                    <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                      {t.channels.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.log.opsForm.whenNoticed}>
                    <TextInput type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                  </Field>
                </div>
                <Field label={t.log.opsForm.whatObserved}>
                  <TextArea rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder={t.log.opsForm.whatObservedPh} />
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{t.log.opsForm.symptomsOnly}</div>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label={t.log.opsForm.effectOnOps}>
                    <Select value={impact} onChange={(e) => setImpact(e.target.value)}>
                      {t.impacts.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.log.opsForm.takenOutNow}>
                    <div style={{ display: 'flex', border: `1.5px solid ${colors.borderStrong}`, borderRadius: 3, overflow: 'hidden', height: 38 }}>
                      {[t.stopYes, t.stopNo].map((s) => (
                        <button key={s} onClick={() => setStopped(s)} style={{ flex: 1, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: stopped === s ? (s === t.stopYes ? colors.redStrong : colors.green) : '#fff', color: stopped === s ? '#fff' : colors.textSoft }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 6, background: colors.bg }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.log.opsForm.attachments}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{t.log.opsForm.attachmentsHint}</div>
                  </div>
                  <Btn variant="secondary" style={{ borderColor: colors.blue }} disabled>{t.log.opsForm.attachBtn}</Btn>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 11.5, color: colors.textSoft, flex: 1 }}>{t.log.opsForm.submitNote}</div>
                  <Btn variant="secondary" onClick={() => navigate('/')}>{t.log.opsForm.cancel}</Btn>
                  <Btn variant="primary" onClick={submitOps}>{t.log.opsForm.submitBtn}</Btn>
                </div>
              </Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Card padding="18px 20px">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div data-qr style={{ width: 56, height: 56, flexShrink: 0, border: `1px solid ${colors.border}`, padding: 3, borderRadius: 3 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 4 }}>{t.log.sidebar.selectedUnit}</div>
                      <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: colors.blue }}>{faultSel.id}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{faultSel.brand} {faultSel.model}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {faultFacts.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderTop: `1px solid ${colors.divider}` }}>
                        <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>{k}</span>
                        <span dir={dirOfSafe(v)} style={{ fontSize: 12, fontWeight: 500, textAlign: 'end', unicodeBidi: 'isolate' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: colors.bg, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>{t.log.sidebar.reportedBy}</span>
                      <span style={{ fontWeight: 600, textAlign: 'end' }}>{(reporter || '').split(' - ')[0] || t.notSet}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>{t.log.sidebar.loggedBy}</span>
                      <span style={{ fontWeight: 600, textAlign: 'end' }}>{person ? `${person.name} - ${person.title || t.roles[person.role]}` : '-'}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 6, background: colors.blue, color: colors.yellow, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                    {t.log.sidebar.pendingNotice}
                  </div>
                </Card>
                <Card padding="18px 20px">
                  <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{t.log.sidebar.recentFaultsTitle}</div>
                  {faultSel.hist.filter((h) => h.kindRaw === 'breakdown').slice(0, 3).map((h) => (
                    <div key={h.id} style={{ padding: '8px 0', borderTop: `1px solid ${colors.divider}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: colors.ink }}>{h.title}</span>
                        <span style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>{h.dateFmt}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: colors.textSoft, marginTop: 2 }}>{h.desc}</div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {stage === 'eng' && (
            <div style={{ display: 'grid', gridTemplateColumns: '290px minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
              <Card padding="18px 20px">
                <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14 }}>{t.log.engStage.awaitingTitle}</div>
                <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 3, marginBottom: 10 }}>{t.log.engStage.awaitingSub}</div>
                {pending.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setEngSelId(p.id)}
                    style={{ width: '100%', textAlign: 'left', marginBottom: 8, padding: '11px 12px', borderRadius: 6, border: `1.5px solid ${engU?.id === p.id ? colors.blue : colors.border}`, background: engU?.id === p.id ? colors.paleBlue : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: fonts.mono, fontSize: 12.5, fontWeight: 700, color: colors.blue }}>{p.id}</span>
                      <span style={{ fontSize: 10.5, color: colors.textMuted, whiteSpace: 'nowrap' }}>{p.reportedAtFmt}</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: colors.ink }}>{p.brand} {p.model}</span>
                    <span style={{ fontSize: 11.5, color: colors.textSoft, lineHeight: 1.45 }}>{p.complaint}</span>
                    <span style={{ fontSize: 11, color: colors.textMuted }}>by {p.reporterShort}</span>
                  </button>
                ))}
                {pending.length === 0 && <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, padding: '10px 0' }}>{t.log.engStage.nothingWaiting}</div>}
              </Card>

              {engU ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
                  <Card padding="20px 24px">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16 }}>{t.log.engStage.opsReportTitle}</div>
                        <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 2 }}>{t.log.engStage.readOnlyNote}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: colors.blue }}>{engU.id}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: engU.badgeBg, color: engU.badgeFg }}>{engU.statusLabel}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, lineHeight: 1.5, padding: '12px 14px', borderRadius: 6, background: colors.bg, borderInlineStart: `3px solid ${colors.yellow}` }}>{engU.complaint}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginTop: 14 }}>
                      {[
                        [t.f.reportedBy, engU.reporter || '-'],
                        [t.f.channel, engU.channel || '-'],
                        [t.f.reportedOn, engU.reportedAtFmt],
                        [t.f.impact, engU.impact || '-'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: colors.bg, borderRadius: 6, padding: '10px 12px' }}>
                          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 4 }}>{k}</div>
                          <div dir={dirOfSafe(v)} style={{ fontSize: 12.5, fontWeight: 600, unicodeBidi: 'isolate' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card padding="24px 28px" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 17 }}>{t.log.stageEngLabel}</div>
                      <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 3 }}>{t.stage.engSub}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label={t.log.engStage.reviewingEngineer}>
                        <Select value={engineer} onChange={(e) => setEngineer(e.target.value)}>
                          <option value="">{t.log.engStage.pickEngineer}</option>
                          {engineerOptions.map((p) => (
                            <option key={p.id} value={p.name}>{p.name} - {p.title || t.roles[p.role]}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label={t.log.engStage.inspectedOn}>
                        <TextInput type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
                      </Field>
                    </div>
                    <Field label={t.log.engStage.decisionLabel}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {([
                          ['approve', t.dec.approve, t.dec.approveSub],
                          ['reject', t.dec.reject, t.dec.rejectSub],
                        ] as const).map(([d, label, sub]) => (
                          <button key={d} onClick={() => setDecision(d)} style={{ flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: 6, border: `1.5px solid ${decision === d ? colors.blue : colors.border}`, background: decision === d ? colors.paleBlue : '#fff', cursor: 'pointer' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{label}</div>
                            <div style={{ fontSize: 11.5, color: colors.textSoft, marginTop: 2 }}>{sub}</div>
                          </button>
                        ))}
                      </div>
                    </Field>

                    {decision === 'approve' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Field label={t.log.engStage.diagnosis}>
                          <TextArea rows={2} placeholder={t.log.engStage.diagnosisPh} />
                        </Field>
                        <Field label={t.log.engStage.faultCategory}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {t.cats.map((c) => (
                              <Chip key={c} label={c} active={faultCat === c} onClick={() => setFaultCat(c)} />
                            ))}
                          </div>
                        </Field>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textBody }}>{t.log.engStage.partsLabel}</label>
                          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                            {parts.map((p, i) => (
                              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 70px 120px 32px', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${colors.divider}`, fontSize: 12.5, alignItems: 'center', background: '#fff' }}>
                                <div style={{ color: colors.ink }}>{p.name}</div>
                                <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>x {p.qty}</div>
                                <div style={{ textAlign: 'end', fontFamily: fonts.mono, fontSize: 11.5 }}>{egp(+p.cost * (+p.qty || 1))}</div>
                                <button onClick={() => setParts((arr) => arr.filter((_, j) => j !== i))} style={{ width: 26, height: 26, borderRadius: 3, border: `1px solid ${colors.border}`, background: '#fff', color: colors.textSoft, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>×</button>
                              </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 70px 120px 32px', gap: 10, padding: '8px 12px', background: colors.bg, alignItems: 'center' }}>
                              <TextInput value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder={t.log.engStage.partNamePh} style={{ height: 32, fontSize: 12.5 }} />
                              <TextInput value={draft.qty} onChange={(e) => setDraft((d) => ({ ...d, qty: e.target.value }))} placeholder={t.log.engStage.qtyPh} style={{ height: 32, fontSize: 12.5, fontFamily: fonts.mono }} />
                              <TextInput value={draft.cost} onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))} placeholder={t.log.engStage.costPh} style={{ height: 32, fontSize: 12.5, fontFamily: fonts.mono, textAlign: 'end' }} />
                              <button onClick={addPart} style={{ width: 32, height: 32, borderRadius: 3, border: 'none', background: colors.blue, color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderTop: `1px solid ${colors.border}`, fontSize: 12 }}>
                              <span style={{ color: colors.textSoft }}>
                                {parts.length} {t.log.engStage.partsCountSuffix} · {t.log.engStage.commonPartsLabel} <span style={{ color: colors.blue }}>{engU.commonParts}</span>
                              </span>
                              <span style={{ fontFamily: fonts.mono, fontWeight: 700, whiteSpace: 'nowrap' }}>{egp(parts.reduce((a, p) => a + (+p.cost || 0) * (+p.qty || 1), 0))}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <Field label={t.log.engStage.severity}>
                            <div style={{ display: 'flex', border: `1.5px solid ${colors.borderStrong}`, borderRadius: 3, overflow: 'hidden', height: 38 }}>
                              {t.sev.map(([label, tone]) => (
                                <button key={label} onClick={() => setSeverity(label)} style={{ flex: 1, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: severity === label ? tone : '#fff', color: severity === label ? '#fff' : colors.textSoft }}>{label}</button>
                              ))}
                            </div>
                          </Field>
                          <Field label={t.log.engStage.priority}>
                            <Select defaultValue={t.priorities[0]}>
                              {t.priorities.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textBody }}>{t.log.engStage.whoFixes}</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[
                              [true, t.route.out, t.route.outSub],
                              [false, t.route.in, t.route.inSub],
                            ].map(([val, label, sub]) => (
                              <button key={String(val)} onClick={() => setSendOut(val as boolean)} style={{ flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: 6, border: `1.5px solid ${sendOut === val ? colors.blue : colors.border}`, background: sendOut === val ? colors.paleBlue : '#fff', cursor: 'pointer' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{label}</div>
                                <div style={{ fontSize: 11.5, color: colors.textSoft, marginTop: 2 }}>{sub}</div>
                              </button>
                            ))}
                          </div>

                          {sendOut ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: colors.textBody }}>{t.log.engStage.quotesLabel} <span style={{ color: colors.textMuted, fontWeight: 400 }}>{t.log.engStage.quotesHint}</span></label>
                                <span style={{ fontSize: 11.5, color: colors.textMuted, whiteSpace: 'nowrap' }}>{qFilled.length ? `${qFilled.length} ${t.q.received}` : t.q.none}</span>
                              </div>
                              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1.3fr) 130px 120px 90px minmax(0,1fr)', gap: 10, padding: '7px 12px', background: colors.bg, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                                  <div>{t.log.engStage.awardCol}</div>
                                  <div>{t.report.companyCol}</div>
                                  <div>{t.report.coversCol}</div>
                                  <div style={{ textAlign: 'end' }}>{t.report.priceCol}</div>
                                  <div style={{ textAlign: 'end' }}>{t.report.leadCol}</div>
                                  <div>{t.detail.warrantyNotesCol}</div>
                                </div>
                                {quotes.map((q, i) => (
                                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1.3fr) 130px 120px 90px minmax(0,1fr)', gap: 10, padding: '8px 12px', borderTop: `1px solid ${colors.divider}`, alignItems: 'center', background: award === i && q.company.trim() ? '#F2F7FF' : '#fff' }}>
                                    <button onClick={() => setAward(i)} title={t.log.engStage.awardCol} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${award === i ? colors.blue : colors.borderStrong}`, background: award === i ? colors.blue : '#fff', cursor: 'pointer', padding: 0, justifySelf: 'center' }} />
                                    <TextInput value={q.company} onChange={(e) => setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))} placeholder={t.log.engStage.companyPh} style={{ height: 32, fontSize: 12.5 }} />
                                    <Select value={q.scope} onChange={(e) => setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, scope: e.target.value } : x)))} style={{ height: 32, fontSize: 12, padding: '0 6px' }}>
                                      {t.scopes.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </Select>
                                    <TextInput value={q.price} onChange={(e) => setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} placeholder={t.log.engStage.pricePh} style={{ height: 32, fontSize: 12.5, fontFamily: fonts.mono, textAlign: 'end' }} />
                                    <TextInput value={q.lead} onChange={(e) => setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, lead: e.target.value } : x)))} placeholder={t.log.engStage.leadPh} style={{ height: 32, fontSize: 12.5, fontFamily: fonts.mono, textAlign: 'end' }} />
                                    <TextInput value={q.note} onChange={(e) => setQuotes((qs) => qs.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} placeholder={t.log.engStage.notePh} style={{ height: 32, fontSize: 12.5 }} />
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 12px', borderTop: `1px solid ${colors.border}`, background: colors.bg, fontSize: 11.5 }}>
                                  <span style={{ color: colors.textSoft }}>{t.log.engStage.leaveBlankNote}</span>
                                  <span style={{ color: colors.blue, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {qFilled.length
                                      ? [cheapest?.priceN ? `${t.q.lowest} ${cheapest.company} · ${egp(cheapest.priceN)}` : '', fastest?.leadN ? `${t.q.fastest} ${fastest.company} · ${fastest.leadN} ${t.days}` : '']
                                          .filter(Boolean)
                                          .join('  |  ')
                                      : ''}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14 }}>
                                <Field label={t.log.engStage.awardedTo}>
                                  <TextInput readOnly value={awarded ? `${awarded.company}${awarded.priceN ? ` — ${egp(awarded.priceN)}` : ''}` : t.q.noAward} style={{ background: colors.bg }} />
                                </Field>
                                <Field label={t.log.engStage.expectedReturn}>
                                  <TextInput readOnly value={awarded && awarded.leadN ? fmt(t, addDays(new Date().toISOString().slice(0, 10), awarded.leadN)) : t.notSet} style={{ background: colors.bg }} />
                                </Field>
                                <Field label={t.log.engStage.woNumber}>
                                  <TextInput value={woDraft} onChange={(e) => setWoDraft(e.target.value)} placeholder="WO-2026-" style={{ fontFamily: fonts.mono }} />
                                </Field>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                              <Field label={t.log.engStage.technician}>
                                <Select defaultValue="">
                                  <option value="">-</option>
                                </Select>
                              </Field>
                              <Field label={t.log.engStage.workshopBay}>
                                <Select defaultValue={t.bays[0]}>
                                  {t.bays.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                </Select>
                              </Field>
                              <Field label={t.log.engStage.expectedCompletion}>
                                <TextInput type="date" defaultValue={addDays(new Date().toISOString().slice(0, 10), 2)} />
                              </Field>
                              <Field label={t.log.engStage.partsSource}>
                                <Select defaultValue={t.sources[0]}>
                                  {t.sources.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </Select>
                              </Field>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {decision === 'reject' && (
                      <Field label={t.log.engStage.rejectNote}>
                        <TextArea rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder={t.log.engStage.rejectNotePh} />
                      </Field>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
                      <div style={{ padding: '8px 12px', borderRadius: 6, background: engStatusBg, color: engStatusFg, fontSize: 12, fontWeight: 600, flex: 1 }}>
                        {decision === 'reject' ? t.eng.returnsTo : t.eng.becomes} <span style={{ textDecoration: 'underline' }}>{engNext === 'operational' ? t.st.operational : engNext === 'vendor' ? t.st.vendor : t.st.maintenance}</span>
                      </div>
                      <Btn variant="secondary" onClick={() => navigate('/')}>{t.log.engStage.cancel}</Btn>
                      <Btn variant="primary" onClick={submitReview}>
                        {decision === 'reject' ? t.eng.subReject : sendOut ? t.eng.subOut : t.eng.subIn}
                      </Btn>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card padding="48px 32px" style={{ border: `1px dashed ${colors.borderStrong}`, textAlign: 'center' }}>
                  <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t.log.engStage.noReportsTitle}</div>
                  <div style={{ fontSize: 12.5, color: colors.textSoft, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>{t.log.engStage.noReportsBody}</div>
                </Card>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ScreenGate>
  );
}
