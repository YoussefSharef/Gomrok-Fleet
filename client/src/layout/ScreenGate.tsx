import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { canSee, type ScreenKey } from '../domain/roles';
import { AppShell } from './AppShell';
import { EmptyState } from '../components/ui';

/** Wraps a screen's rendered output; swaps in the "not available for your
 * role" panel (still inside the normal app shell) when the signed-in
 * person's role doesn't cover this screen. */
export function ScreenGate({ screen, children }: { screen: ScreenKey; children: ReactNode }) {
  const { person } = useAuth();
  const { t } = useI18n();
  if (person && !canSee(person.role, screen)) {
    return (
      <AppShell screen={screen}>
        <EmptyState title={t.noAccess.title} body={t.noAccess.body} />
      </AppShell>
    );
  }
  return <>{children}</>;
}
