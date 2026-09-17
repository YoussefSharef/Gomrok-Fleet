import { useRef, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n, type Locale } from '../i18n';
import { useData } from '../data/DataContext';
import { useAuth } from '../auth/AuthContext';
import { Btn } from '../components/ui';
import { colors } from '../styles/tokens';
import { todayWithWeekday } from '../domain/format';
import type { ScreenKey } from '../domain/roles';

export function Topbar({
  screen,
  titleOverride,
  subtitleOverride,
}: {
  screen: ScreenKey;
  titleOverride?: string;
  subtitleOverride?: string;
}) {
  const { t, locale, setLocale } = useI18n();
  const { exportData, importData } = useData();
  const { person } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInput = useRef<HTMLInputElement>(null);

  const title = titleOverride ?? t.title[screen];
  const subtitle = subtitleOverride ?? (screen === 'detail' ? '' : t.subtitle[screen]);

  const doExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gomrok-equipment-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.units)) importData({ units: parsed.units, vendors: parsed.vendors || [] });
      } catch {
        /* ignore malformed file */
      }
    };
    reader.readAsText(file);
  };

  const otherLocale: Locale = locale === 'en' ? 'ar' : 'en';

  return (
    <div
      style={{
        height: 60,
        background: '#fff',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Funnel Display', sans-serif", fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <button
        onClick={() => setLocale(otherLocale)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 34,
          padding: '0 12px',
          borderRadius: 3,
          border: `1.5px solid ${colors.border}`,
          background: '#fff',
          color: colors.blue,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        {t.topbar.switchLabel}
      </button>
      <div
        style={{
          fontFamily: "'Tektur', monospace",
          fontSize: 11,
          letterSpacing: '0.08em',
          color: colors.textSoft,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {todayWithWeekday(t)}
      </div>
      <Btn variant="secondary" onClick={doExport}>
        {t.topbar.export}
      </Btn>
      {person?.role === 'admin' && (
        <label
          style={{
            height: 34,
            padding: '0 12px',
            borderRadius: 3,
            border: `1.5px solid ${colors.border}`,
            background: '#fff',
            color: colors.blue,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {t.topbar.import}
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImportFile(f);
              e.target.value = '';
            }}
          />
        </label>
      )}
      <SearchBox initial={searchParams.get('q') || ''} navigate={navigate} placeholder={t.topbar.search} />
      <Btn variant="primary" onClick={() => navigate('/log')}>
        {t.topbar.logFault}
      </Btn>
    </div>
  );
}

function SearchBox({
  initial,
  navigate,
  placeholder,
}: {
  initial: string;
  navigate: ReturnType<typeof useNavigate>;
  placeholder: string;
}): ReactNode {
  return (
    <input
      defaultValue={initial}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const q = (e.target as HTMLInputElement).value.trim();
          navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
        }
      }}
      style={{
        width: 230,
        height: 34,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 4,
        padding: '0 12px',
        fontSize: 13,
        outline: 'none',
        background: '#fff',
      }}
    />
  );
}
