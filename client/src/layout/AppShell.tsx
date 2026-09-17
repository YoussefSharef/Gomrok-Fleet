import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { colors } from '../styles/tokens';
import type { ScreenKey } from '../domain/roles';

export function AppShell({
  screen,
  titleOverride,
  subtitleOverride,
  children,
}: {
  screen: ScreenKey;
  titleOverride?: string;
  subtitleOverride?: string;
  children: ReactNode;
}) {
  return (
    <div data-app style={{ display: 'flex', height: '100vh', minWidth: 1440, overflow: 'hidden', background: colors.bg }}>
      <Sidebar active={screen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar screen={screen} titleOverride={titleOverride} subtitleOverride={subtitleOverride} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
