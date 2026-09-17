import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { NAV_ICONS } from '../domain/icons';
import { SCREEN_ROLES, type ScreenKey } from '../domain/roles';
import { colors } from '../styles/tokens';
import type { Dict } from '../i18n/types';

function navLabel(t: Dict, key: ScreenKey): string {
  if (key === 'people') return t.people.nav;
  return t.nav[key];
}

const NAV_ORDER: { key: ScreenKey; path: string }[] = [
  { key: 'fleet', path: '/' },
  { key: 'add', path: '/add' },
  { key: 'detail', path: '' },
  { key: 'schedule', path: '/schedule' },
  { key: 'vendors', path: '/vendors' },
  { key: 'log', path: '/log' },
  { key: 'people', path: '/people' },
  { key: 'reports', path: '/reports' },
];

export function Sidebar({ active }: { active: ScreenKey }) {
  const { t } = useI18n();
  const { person, logout } = useAuth();
  const { units, selectedUnitId } = useData();
  const navigate = useNavigate();

  const dueCount = useMemo(() => units.filter((u) => u.status === 'due').length, [units]);
  const pendingCount = useMemo(() => units.filter((u) => u.status === 'reported').length, [units]);
  const badge: Partial<Record<ScreenKey, number>> = { schedule: dueCount, log: pendingCount };

  const detailPath = () => {
    const id = (selectedUnitId && units.some((u) => u.id === selectedUnitId) ? selectedUnitId : units[0]?.id) || '';
    return id ? `/units/${encodeURIComponent(id)}` : '/units/none';
  };

  const initials = person ? person.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <aside style={{ width: 220, background: colors.navy, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src="/assets/logo-yellow.png" alt="Gomrok" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
      </div>
      <div
        style={{
          padding: '14px 20px 4px',
          fontFamily: "'Tektur', monospace",
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        {t.sidebarLabel}
      </div>
      <nav style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ORDER.filter((n) => person && SCREEN_ROLES[n.key].includes(person.role)).map((n) => {
          const isActive = active === n.key;
          const b = badge[n.key];
          return (
            <button
              key={n.key}
              onClick={() => navigate(n.key === 'detail' ? detailPath() : n.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'start',
                width: '100%',
                background: isActive ? 'rgba(255,210,3,0.15)' : 'transparent',
                color: isActive ? colors.yellow : 'rgba(255,255,255,0.65)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span
                style={{ width: 18, height: 18, display: 'inline-flex', flexShrink: 0 }}
                // Static, hand-authored icon set — safe to inject.
                dangerouslySetInnerHTML={{ __html: NAV_ICONS[n.key] }}
              />
              <span style={{ flex: 1 }}>{navLabel(t, n.key)}</span>
              {!!b && (
                <span
                  style={{
                    fontFamily: "'Tektur', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    background: colors.yellow,
                    color: colors.blue,
                    borderRadius: 999,
                    padding: '1px 7px',
                  }}
                >
                  {b}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: colors.yellow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: colors.blue,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {person?.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {person ? person.title || t.roles[person.role] : ''}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            height: 30,
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {t.login.signOut}
        </button>
      </div>
    </aside>
  );
}
