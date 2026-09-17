import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { decorateUnit, unitFacts, unitKpis } from '../domain/decorate';
import { makeQrSvg } from '../domain/qr';
import { QR_BASE } from '../domain/status';
import { Btn, Card, EmptyState, Field, StatusPill, Tab, TabGroup, TextInput } from '../components/ui';
import { colors, fonts } from '../styles/tokens';
import { QrTagOverlay } from '../components/QrTagOverlay';
import { PrintReportOverlay } from '../components/PrintReportOverlay';

type HistoryView = 'timeline' | 'table';

export function DetailScreen() {
  const { t } = useI18n();
  const { person } = useAuth();
  const { units, addServiceEvent, setSelectedUnitId } = useData();
  const { id } = useParams();
  const navigate = useNavigate();
  const [historyView, setHistoryView] = useState<HistoryView>('timeline');
  const [addingSvc, setAddingSvc] = useState(false);
  const [overlay, setOverlay] = useState<'qr' | 'report' | null>(null);
  const [svc, setSvc] = useState({ date: '', kind: 'preventive' as 'preventive' | 'breakdown', title: '', desc: '', vendor: '', wo: '', cost: '' });

  const unit = units.find((u) => u.id === id) || null;

  useEffect(() => {
    if (unit) setSelectedUnitId(unit.id);
  }, [unit, setSelectedUnitId]);

  useEffect(() => {
    if (units.length && !unit) navigate(`/units/${encodeURIComponent(units[0].id)}`, { replace: true });
  }, [units, unit, navigate]);

  const sel = useMemo(() => (unit ? decorateUnit(unit, t) : null), [unit, t]);
  const facts = useMemo(() => (sel ? unitFacts(sel, t) : []), [sel, t]);
  const kpis = useMemo(() => (sel ? unitKpis(sel, t) : []), [sel, t]);
  const qrSvg = useMemo(() => (sel ? makeQrSvg(QR_BASE + sel.id) : ''), [sel]);

  const saveSvc = async () => {
    if (!sel || !svc.date || !svc.title.trim()) return;
    await addServiceEvent(sel.id, {
      date: svc.date,
      kind: svc.kind,
      title: svc.title.trim(),
      desc: svc.desc.trim(),
      vendor: svc.vendor || '-',
      wo: svc.wo || '-',
      cost: +String(svc.cost).replace(/[^\d.]/g, '') || 0,
    });
    setAddingSvc(false);
    setSvc({ date: '', kind: 'preventive', title: '', desc: '', vendor: '', wo: '', cost: '' });
  };

  return (
    <ScreenGate screen="detail">
      <AppShell screen="detail" subtitleOverride={sel ? `${sel.id} · ${sel.typeName}` : ''}>
        {units.length === 0 && <EmptyState title={t.detailEmpty.title} body={t.detailEmpty.body} />}
        {sel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button onClick={() => navigate('/')} style={{ alignSelf: 'flex-start', fontSize: 12, color: colors.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              {t.detail.backToFleet}
            </button>

            <Card padding="20px 24px" style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div data-qr style={{ width: 72, height: 72, flexShrink: 0, border: `1px solid ${colors.border}`, padding: 4, borderRadius: 3, background: '#fff' }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: colors.blue, letterSpacing: '0.04em' }}>{sel.id}</span>
                  <StatusPill bg={sel.badgeBg} fg={sel.badgeFg} label={sel.statusLabel} />
                </div>
                <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 22, marginBottom: 6 }}>
                  {sel.brand} {sel.model} <span style={{ color: colors.textMuted, fontWeight: 500 }}>· {sel.typeName}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: colors.textSoft, flexWrap: 'wrap' }}>
                  <span>{t.detail.serialLabel} <span style={{ fontFamily: fonts.mono, color: colors.slate }}>{sel.serial}</span></span>
                  <span style={{ color: colors.borderStrong }}>·</span>
                  <span>{sel.zone}</span>
                  <span style={{ color: colors.borderStrong }}>·</span>
                  <span>{sel.hoursLabel} <span style={{ fontFamily: fonts.mono, color: colors.slate }}>{sel.hoursFmt}</span></span>
                  <span style={{ color: colors.borderStrong }}>·</span>
                  <span>{t.detail.nextServiceLabel} <b style={{ color: sel.nextColor }}>{sel.nextFmt}</b></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn variant="secondary" style={{ borderColor: colors.blue }} onClick={() => setOverlay('qr')}>{t.detail.qrTagBtn}</Btn>
                <Btn variant="secondary" style={{ borderColor: colors.blue }} onClick={() => setOverlay('report')}>{t.detail.printReportBtn}</Btn>
                <Btn variant="primary" onClick={() => navigate(`/log?unit=${encodeURIComponent(sel.id)}`)}>{t.detail.logFaultBtn}</Btn>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
              {kpis.map((k) => (
                <Card key={k.label} accent={k.accent} padding="14px 16px">
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 800, color: colors.blue, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 5 }}>{k.sub}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 18, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
                {sel.hasIssue && (
                  <Card padding="18px 22px">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.detail.openWorkOrderTitle}</div>
                      <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.blue, fontWeight: 700 }}>{sel.wo}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 14 }}>{sel.issue}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 14 }}>
                      {[
                        [t.report.handledBy, sel.vendor],
                        [t.report.sentLogged, sel.sentFmt],
                        [t.report.expectedReturn, sel.etaFmt],
                        [t.report.quotedTotal, sel.costFmt],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: colors.bg, borderRadius: 6, padding: '10px 12px' }}>
                          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 4 }}>{k}</div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: k === t.report.quotedTotal ? fonts.mono : undefined }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 60px 110px', gap: 10, padding: '7px 12px', background: colors.bg, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                        <div>{t.detail.partsCol}</div>
                        <div>{t.detail.qtyCol}</div>
                        <div style={{ textAlign: 'right' }}>{t.detail.costCol}</div>
                      </div>
                      {sel.partsDeco.map((p) => (
                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 60px 110px', gap: 10, padding: '8px 12px', borderTop: `1px solid ${colors.divider}`, fontSize: 12.5, alignItems: 'center' }}>
                          <div style={{ color: colors.ink }}>{p.name}</div>
                          <div style={{ fontFamily: fonts.mono, fontSize: 11.5 }}>{p.qtyFmt}</div>
                          <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 11.5 }}>{p.costFmt}</div>
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 60px 110px', gap: 10, padding: '8px 12px', borderTop: `1px solid ${colors.divider}`, fontSize: 12.5, color: colors.textSoft }}>
                        <div>{t.report.labourTransport}</div>
                        <div />
                        <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 11.5 }}>{sel.labourFmt}</div>
                      </div>
                    </div>
                    {sel.hasQuotes && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 8 }}>
                          {t.detail.quotesComparedLabel} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({sel.quoteCount})</span>
                        </div>
                        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) 120px 110px 80px minmax(0,1fr) 88px', gap: 10, padding: '7px 12px', background: colors.bg, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                            <div>{t.report.companyCol}</div>
                            <div>{t.report.coversCol}</div>
                            <div style={{ textAlign: 'end' }}>{t.report.priceCol}</div>
                            <div style={{ textAlign: 'end' }}>{t.report.leadCol}</div>
                            <div>{t.detail.warrantyNotesCol}</div>
                            <div style={{ textAlign: 'end' }}>{t.report.decisionCol}</div>
                          </div>
                          {sel.quotesDeco.map((q) => (
                            <div key={q.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) 120px 110px 80px minmax(0,1fr) 88px', gap: 10, padding: '8px 12px', borderTop: `1px solid ${colors.divider}`, alignItems: 'center', fontSize: 12 }}>
                              <div style={{ fontWeight: 500, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.company}</div>
                              <div style={{ color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.scope}</div>
                              <div style={{ textAlign: 'end', fontFamily: fonts.mono, fontSize: 11.5 }}>{q.priceFmt}</div>
                              <div style={{ textAlign: 'end', fontFamily: fonts.mono, fontSize: 11.5 }}>{q.leadFmt}</div>
                              <div style={{ color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.note}</div>
                              <div style={{ textAlign: 'end' }}>
                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap', background: q.tagBg, color: q.tagFg }}>{q.tag}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                <Card padding="18px 22px">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.detail.serviceHistoryTitle}</div>
                    <TabGroup>
                      <Tab label={t.view.timeline} active={historyView === 'timeline'} onClick={() => setHistoryView('timeline')} />
                      <Tab label={t.view.table} active={historyView === 'table'} onClick={() => setHistoryView('table')} />
                    </TabGroup>
                  </div>
                  {historyView === 'timeline' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {sel.hist.map((h) => (
                        <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '110px 24px minmax(0,1fr)', gap: '0 10px' }}>
                          <div style={{ fontSize: 11.5, color: colors.textMuted, paddingTop: 2, textAlign: 'right' }}>{h.dateFmt}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: h.dot, border: '2px solid #fff', boxShadow: `0 0 0 2px ${h.dot}`, marginTop: 3 }} />
                            <span style={{ width: 2, flex: 1, background: colors.border, margin: '4px 0' }} />
                          </div>
                          <div style={{ paddingBottom: 18 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{h.title}</div>
                            <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>{h.desc}</div>
                            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: colors.textMuted }}>
                              <span>{h.vendor}</span>
                              <span style={{ fontFamily: fonts.mono, color: colors.blue }}>{h.wo}</span>
                              <span style={{ fontFamily: fonts.mono }}>{h.costFmt}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1.4fr 1fr 110px 90px', gap: 10, padding: '8px 12px', background: colors.bg, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                        <div>{t.detail.histTable.date}</div>
                        <div>{t.detail.histTable.workDone}</div>
                        <div>{t.detail.histTable.company}</div>
                        <div>{t.detail.histTable.wo}</div>
                        <div style={{ textAlign: 'right' }}>{t.detail.histTable.cost}</div>
                      </div>
                      {sel.hist.map((h) => (
                        <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '100px 1.4fr 1fr 110px 90px', gap: 10, padding: '9px 12px', borderTop: `1px solid ${colors.divider}`, fontSize: 12, color: colors.textBody, alignItems: 'center' }}>
                          <div>{h.dateFmt}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: colors.ink }}>{h.title}</div>
                            <div style={{ fontSize: 11, color: colors.textSoft }}>{h.desc}</div>
                          </div>
                          <div>{h.vendor}</div>
                          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.blue }}>{h.wo}</div>
                          <div style={{ textAlign: 'right', fontFamily: fonts.mono, fontSize: 11 }}>{h.costFmt}</div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '9px 12px', borderTop: `1px solid ${colors.border}`, background: colors.bg, fontSize: 12 }}>
                        <span style={{ color: colors.textSoft }}>{t.detail.totalCostToDate}</span>
                        <span style={{ fontFamily: fonts.mono, fontWeight: 700, color: colors.ink }}>{sel.costToDateFmt}</span>
                      </div>
                    </div>
                  )}
                </Card>

                <Card padding="18px 22px">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.detail.pastRecordsTitle}</div>
                      <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 2 }}>{t.detail.pastRecordsSub}</div>
                    </div>
                    <Btn variant="secondary" style={{ borderColor: colors.blue }} onClick={() => setAddingSvc((v) => !v)}>{t.detail.addRecordBtn}</Btn>
                  </div>
                  {addingSvc && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
                        <Field label={t.detail.svcForm.date}>
                          <TextInput type="date" value={svc.date} onChange={(e) => setSvc((s) => ({ ...s, date: e.target.value }))} />
                        </Field>
                        <Field label={t.detail.svcForm.typeOfWork}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(['preventive', 'breakdown'] as const).map((k) => (
                              <button
                                key={k}
                                onClick={() => setSvc((s) => ({ ...s, kind: k }))}
                                style={{ height: 32, padding: '0 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', border: `1.5px solid ${svc.kind === k ? colors.blue : colors.border}`, background: svc.kind === k ? colors.blue : '#fff', color: svc.kind === k ? '#fff' : colors.textSoft, cursor: 'pointer' }}
                              >
                                {t.kind[k]}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>
                      <Field label={t.detail.svcForm.workCarriedOut}>
                        <TextInput value={svc.title} onChange={(e) => setSvc((s) => ({ ...s, title: e.target.value }))} placeholder={t.detail.svcForm.workPh} />
                      </Field>
                      <Field label={t.detail.svcForm.detail}>
                        <TextInput value={svc.desc} onChange={(e) => setSvc((s) => ({ ...s, desc: e.target.value }))} placeholder={t.detail.svcForm.detailPh} />
                      </Field>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14 }}>
                        <Field label={t.detail.svcForm.company}>
                          <TextInput value={svc.vendor} onChange={(e) => setSvc((s) => ({ ...s, vendor: e.target.value }))} placeholder={t.detail.svcForm.companyPh} />
                        </Field>
                        <Field label={t.detail.svcForm.woInvoice}>
                          <TextInput value={svc.wo} onChange={(e) => setSvc((s) => ({ ...s, wo: e.target.value }))} placeholder="WO-" style={{ fontFamily: fonts.mono }} />
                        </Field>
                        <Field label={t.detail.svcForm.cost}>
                          <TextInput value={svc.cost} onChange={(e) => setSvc((s) => ({ ...s, cost: e.target.value }))} placeholder="0" style={{ fontFamily: fonts.mono }} />
                        </Field>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Btn variant="secondary" onClick={() => setAddingSvc(false)}>{t.detail.svcForm.cancel}</Btn>
                        <Btn variant="primary" onClick={saveSvc}>{t.detail.svcForm.save}</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Card padding="18px 20px">
                  <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t.detail.assetRecordTitle}</div>
                  {facts.map((f) => (
                    <div key={f.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: `1px solid ${colors.divider}` }}>
                      <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>{f.k}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right', color: colors.ink }}>{f.v}</span>
                    </div>
                  ))}
                </Card>
                <div style={{ background: colors.blue, borderRadius: 6, padding: '18px 20px', color: '#fff' }}>
                  <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.yellow, marginBottom: 8 }}>{t.detail.planCardTitle}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{sel.plan}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                    <span>{sel.sinceLabel}</span>
                    <span style={{ fontFamily: fonts.mono, color: '#fff' }}>{sel.sinceHours} / {sel.planIntervalHours}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sel.pct}%`, background: colors.yellow }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                    <span>{t.p.last}</span>
                    <span style={{ color: '#fff' }}>{sel.lastFmt}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                    <span>{t.p.next}</span>
                    <span style={{ color: colors.yellow, fontWeight: 600 }}>{sel.nextFmt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {overlay === 'qr' && sel && <QrTagOverlay t={t} unit={sel} onClose={() => setOverlay(null)} />}
        {overlay === 'report' && sel && <PrintReportOverlay t={t} sel={sel} person={person} onClose={() => setOverlay(null)} />}
      </AppShell>
    </ScreenGate>
  );
}
