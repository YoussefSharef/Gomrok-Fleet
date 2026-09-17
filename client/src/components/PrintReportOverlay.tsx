import { PrintOverlayShell } from './QrTagOverlay';
import { makeQrSvg } from '../domain/qr';
import { QR_BASE } from '../domain/status';
import { unitFacts, unitKpis, unitPlanRows, reportNotes, type DecoratedUnit } from '../domain/decorate';
import { todayLong } from '../domain/format';
import { dirOfSafe } from '../i18n';
import { colors, fonts } from '../styles/tokens';
import type { Dict } from '../i18n/types';
import type { Person } from '../domain/types';

export function PrintReportOverlay({ t, sel, person, onClose }: { t: Dict; sel: DecoratedUnit; person: Person | null; onClose: () => void }) {
  const reportNo = `MR-${new Date().getFullYear()}-${sel.id}`;
  const generatedOn = todayLong(t);
  const facts = unitFacts(sel, t);
  const kpis = unitKpis(sel, t);
  const planRows = unitPlanRows(sel, t);
  const notes = reportNotes(sel, t);
  const histSectionNo = sel.hasIssue ? 4 : 3;
  const notesSectionNo = sel.hasIssue ? 5 : 4;
  const preparedBy = person ? `${person.name}, ${person.title || t.roles[person.role]}` : '-';
  const qrUrl = QR_BASE + sel.id;
  const qrSvg = makeQrSvg(qrUrl);

  const cell: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${colors.divider}`, padding: '5px 0' };

  return (
    <PrintOverlayShell t={t} hint={t.hint.report} onClose={onClose}>
      <div data-page style={{ width: 794, minHeight: 1123, background: '#fff', padding: '44px 48px', borderRadius: 6, boxShadow: colors.modalShadow, display: 'flex', flexDirection: 'column', gap: 20, color: colors.ink }}>
        <div data-block style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `3px solid ${colors.yellow}`, paddingBottom: 14 }}>
          <div>
            <img src="/assets/logo-navy.png" alt="Gomrok" style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 8 }} />
            <div style={{ fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2558A0' }}>{t.report.orgLine}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 21, lineHeight: 1.15 }}>{t.report.docTitle}</div>
            <div style={{ fontSize: 11.5, color: colors.textSoft, marginTop: 5 }}>{t.report.issuedOn(reportNo, generatedOn)}</div>
          </div>
        </div>

        <div data-block style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
          <div style={{ width: 118, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: `1px solid ${colors.border}`, borderRadius: 4, padding: '10px 8px' }}>
            <div data-qr style={{ width: 92, height: 92 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div style={{ fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: '0.08em', color: colors.textMuted, textAlign: 'center', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: t.print.scanLive }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, color: colors.blue, letterSpacing: '0.03em', lineHeight: 1 }}>{sel.id}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: sel.badgeBg, color: sel.badgeFg, whiteSpace: 'nowrap' }}>{sel.statusLabel}</span>
              <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16 }}>{sel.brand} {sel.model}</span>
              <span style={{ fontSize: 13, color: colors.textSoft }}>{sel.typeName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', fontSize: 12 }}>
              {facts.map((f) => (
                <div key={f.k} style={cell}>
                  <span style={{ color: colors.textSoft, whiteSpace: 'nowrap' }}>{f.k}</span>
                  <span dir={dirOfSafe(f.v)} style={{ fontWeight: 500, textAlign: 'end', unicodeBidi: 'isolate' }}>{f.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div data-block>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 13.5, color: colors.blue, borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10 }}>1 · {t.report.section1}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
            {kpis.map((s) => (
              <div key={s.label} style={{ border: `1px solid ${colors.border}`, borderTop: `3px solid ${s.accent}`, borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>{s.label}</div>
                <div style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 800, color: colors.blue, marginTop: 4, lineHeight: 1.1 }}>{s.value}</div>
                <div dir={dirOfSafe(s.sub)} style={{ fontSize: 10, color: colors.textMuted, marginTop: 3, lineHeight: 1.35, unicodeBidi: 'isolate' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div data-block>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 13.5, color: colors.blue, borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10 }}>2 · {t.report.section2}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', fontSize: 12 }}>
            {planRows.map((f) => (
              <div key={f.k} style={cell}>
                <span style={{ color: colors.textSoft, whiteSpace: 'nowrap' }}>{f.k}</span>
                <span dir={dirOfSafe(f.v)} style={{ fontWeight: 500, textAlign: 'end', unicodeBidi: 'isolate', color: f.color }}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        {sel.hasIssue && (
          <div data-block>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10 }}>
              <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 13.5, color: colors.blue }}>3 · {t.report.openWorkOrder}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 11.5, fontWeight: 700, color: colors.blue }}>{sel.wo}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{sel.issue}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 10, fontSize: 11.5 }}>
              {[
                [t.report.handledBy, sel.vendor],
                [t.report.sentLogged, sel.sentFmt],
                [t.report.expectedReturn, sel.etaFmt],
                [t.report.quotedTotal, sel.costFmt],
              ].map(([k, v]) => (
                <div key={k} style={{ background: colors.bg, borderRadius: 4, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontFamily: k === t.report.quotedTotal ? fonts.mono : undefined }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', fontSize: 11.5 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 50px 100px 110px', gap: 10, padding: '6px 12px', background: colors.bg, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                <div>{t.report.partCol}</div>
                <div style={{ textAlign: 'center' }}>{t.report.qtyCol}</div>
                <div style={{ textAlign: 'right' }}>{t.report.unitPriceCol}</div>
                <div style={{ textAlign: 'right' }}>{t.report.lineTotalCol}</div>
              </div>
              {sel.partsDeco.map((p) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 50px 100px 110px', gap: 10, padding: '6px 12px', borderTop: `1px solid ${colors.divider}`, alignItems: 'center' }}>
                  <div>{p.name}</div>
                  <div style={{ textAlign: 'center', fontFamily: fonts.mono }}>{p.qty}</div>
                  <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{p.unitFmt}</div>
                  <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{p.lineFmt}</div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 50px 100px 110px', gap: 10, padding: '6px 12px', borderTop: `1px solid ${colors.divider}`, color: colors.textSoft }}>
                <div>{t.report.labourTransport}</div>
                <div />
                <div />
                <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{sel.labourFmt}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 50px 100px 110px', gap: 10, padding: '7px 12px', borderTop: `1px solid ${colors.border}`, background: colors.bg, fontWeight: 700 }}>
                <div>{t.report.totalQuoted}</div>
                <div />
                <div />
                <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{sel.costFmt}</div>
              </div>
            </div>
            {sel.hasQuotes && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted, marginBottom: 6 }}>{t.report.quotesCompared}</div>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', fontSize: 11.5 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) 110px 100px 70px 80px', gap: 10, padding: '6px 12px', background: colors.bg, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
                    <div>{t.report.companyCol}</div>
                    <div>{t.report.coversCol}</div>
                    <div style={{ textAlign: 'end' }}>{t.report.priceCol}</div>
                    <div style={{ textAlign: 'end' }}>{t.report.leadCol}</div>
                    <div style={{ textAlign: 'end' }}>{t.report.decisionCol}</div>
                  </div>
                  {sel.quotesDeco.map((q) => (
                    <div key={q.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) 110px 100px 70px 80px', gap: 10, padding: '6px 12px', borderTop: `1px solid ${colors.divider}`, alignItems: 'center' }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.company}</div>
                      <div style={{ color: colors.textSoft }}>{q.scope}</div>
                      <div style={{ textAlign: 'end', fontFamily: fonts.mono }}>{q.priceFmt}</div>
                      <div style={{ textAlign: 'end', fontFamily: fonts.mono }}>{q.leadFmt}</div>
                      <div style={{ textAlign: 'end', fontWeight: 600, color: q.tagFg }}>{q.tag}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div data-block>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 13.5, color: colors.blue }}>{histSectionNo} · {t.report.serviceHistory}</span>
            <span style={{ fontSize: 11, color: colors.textMuted }}>{t.report.entriesSince(sel.hist.length, sel.purchasedFmt)}</span>
          </div>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', fontSize: 11.5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '82px 96px minmax(0,1fr) 108px 86px 82px', gap: 10, padding: '6px 12px', background: colors.bg, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted }}>
              <div>{t.report.dateCol}</div>
              <div>{t.report.typeCol}</div>
              <div>{t.report.workCol}</div>
              <div>{t.report.companyCol}</div>
              <div>{t.report.woCol}</div>
              <div style={{ textAlign: 'right' }}>{t.report.costCol}</div>
            </div>
            {sel.hist.map((h) => (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '82px 96px minmax(0,1fr) 108px 86px 82px', gap: 10, padding: '6px 12px', borderTop: `1px solid ${colors.divider}`, alignItems: 'center' }}>
                <div style={{ whiteSpace: 'nowrap' }}>{h.dateFmt}</div>
                <div>
                  <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 999, fontSize: 9.5, fontWeight: 600, background: h.kindBg, color: h.kindFg, whiteSpace: 'nowrap' }}>{h.kind}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{h.title}</div>
                  <div style={{ color: colors.textSoft, fontSize: 10.5, lineHeight: 1.35 }}>{h.desc}</div>
                </div>
                <div>{h.vendor}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 10 }}>{h.wo}</div>
                <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{h.costShort}</div>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 82px', gap: 10, padding: '7px 12px', borderTop: `1px solid ${colors.border}`, background: colors.bg, fontWeight: 700 }}>
              <div>{t.report.totalSpent}</div>
              <div style={{ textAlign: 'right', fontFamily: fonts.mono }}>{sel.costToDateFmt}</div>
            </div>
          </div>
        </div>

        <div data-block>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 13.5, color: colors.blue, borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10 }}>{notesSectionNo} · {t.report.notesRecommendation}</div>
          {notes.map((n) => (
            <div key={n} style={{ display: 'flex', gap: 9, fontSize: 12, lineHeight: 1.5, padding: '3px 0' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.yellow, flexShrink: 0, marginTop: 7 }} />
              <span>{n}</span>
            </div>
          ))}
        </div>

        <div data-block style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 8 }}>
          <div>
            <div style={{ height: 30 }} />
            <div style={{ borderTop: '1px solid #9A9990', paddingTop: 5, fontSize: 11, color: colors.textSoft }}>{preparedBy}</div>
          </div>
          <div>
            <div style={{ height: 30 }} />
            <div style={{ borderTop: '1px solid #9A9990', paddingTop: 5, fontSize: 11, color: colors.textSoft }}>{t.report.reviewedBy}</div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${colors.border}`, paddingTop: 10, fontSize: 10, color: colors.textMuted }}>
          <span style={{ fontFamily: fonts.mono, letterSpacing: '0.1em' }}>{t.report.footerOrg}</span>
          <span>{reportNo} · {qrUrl}</span>
        </div>
      </div>
    </PrintOverlayShell>
  );
}
