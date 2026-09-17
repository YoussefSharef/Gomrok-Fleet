import type { ReactNode } from 'react';
import { makeQrSvg } from '../domain/qr';
import { QR_BASE } from '../domain/status';
import { colors, fonts } from '../styles/tokens';
import type { DecoratedUnit } from '../domain/decorate';
import type { Dict } from '../i18n/types';

export function PrintOverlayShell({
  t,
  hint,
  onClose,
  children,
}: {
  t: Dict;
  hint: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      data-print
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,45,82,0.7)',
        zIndex: 50,
        overflow: 'auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div data-noprint style={{ width: 794, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{hint}</div>
        <button
          onClick={() => window.print()}
          style={{ height: 36, padding: '0 18px', borderRadius: 3, border: 'none', background: colors.yellow, color: colors.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {t.print.downloadPdf}
        </button>
        <button
          onClick={onClose}
          style={{ height: 36, padding: '0 14px', borderRadius: 3, border: '1.5px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {t.print.close}
        </button>
      </div>
      {children}
    </div>
  );
}

export function QrTagOverlay({ t, unit, onClose }: { t: Dict; unit: DecoratedUnit; onClose: () => void }) {
  const svg = makeQrSvg(QR_BASE + unit.id);
  return (
    <PrintOverlayShell t={t} hint={t.hint.qr} onClose={onClose}>
      <div
        data-page
        style={{
          width: 360,
          background: '#fff',
          padding: 28,
          borderRadius: 6,
          boxShadow: colors.modalShadow,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
          border: `6px solid ${colors.yellow}`,
        }}
      >
        <img src="/assets/logo-navy.png" alt="Gomrok" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        <div data-qr style={{ width: 220, height: 220 }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 700, color: colors.blue, letterSpacing: '0.04em', lineHeight: 1 }}>{unit.id}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{unit.brand} {unit.model}</div>
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSoft }}>S/N {unit.serial}</div>
        <div style={{ fontSize: 11, color: colors.textMuted, borderTop: `1px solid ${colors.border}`, paddingTop: 10, width: '100%' }}>{t.print.scanQrTag}</div>
      </div>
    </PrintOverlayShell>
  );
}
