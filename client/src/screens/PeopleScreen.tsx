import { useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { ROLE_KEYS } from '../domain/roles';
import type { Role } from '../domain/types';
import { Btn, Card, Chip, Field, TextInput } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

export function PeopleScreen() {
  const { t } = useI18n();
  const { person: me } = useAuth();
  const { people, createPerson, deletePerson } = useData();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('operator');
  const [title, setTitle] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    if (!name.trim() || pin.trim().length < 4) {
      setError('Enter a name and a 4-digit PIN.');
      return;
    }
    try {
      await createPerson({ name: name.trim(), role, title: title.trim(), pin: pin.trim() });
      setName('');
      setTitle('');
      setPin('');
      setRole('operator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this person.');
    }
  };

  const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ScreenGate screen="people">
      <AppShell screen="people">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,420px) minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
          <Card padding="22px 24px" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16 }}>{t.people.addTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 3 }}>
                Name, role and a 4-digit PIN. Operators appear in fault reports; engineers in the review step.
              </div>
            </div>
            <Field label={t.people.name}>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t.people.role}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ROLE_KEYS.map((r) => (
                  <Chip key={r} label={t.roles[r]} active={role === r} onClick={() => setRole(r)} />
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
              <Field label={t.people.jobTitle}>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.people.jobPh} />
              </Field>
              <Field label={t.people.pin}>
                <TextInput value={pin} onChange={(e) => setPin(e.target.value)} placeholder="0000" style={{ fontFamily: fonts.mono }} />
              </Field>
            </div>
            {error && <div style={{ color: colors.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
            <Btn variant="primary" onClick={save} style={{ alignSelf: 'flex-start' }}>{t.people.save}</Btn>
          </Card>

          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15 }}>{t.people.listTitle}</div>
              <div style={{ fontSize: 11.5, color: colors.textMuted }}>{people.length} {t.people.countSuffix}</div>
            </div>
            {people.map((p) => {
              const isMe = p.name === me?.name;
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px minmax(0,1.2fr) minmax(0,1fr) 150px 80px', gap: 12, padding: '11px 18px', borderBottom: `1px solid ${colors.divider}`, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.paleBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: colors.blue }}>{initials(p.name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name} {isMe && <span style={{ color: colors.textMuted, fontWeight: 500 }}>{t.people.you}</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: colors.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || '-'}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.textSoft, lineHeight: 1.4 }}>{t.people.roleHint[p.role]}</div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: colors.divider, color: colors.slate, whiteSpace: 'nowrap' }}>{t.roles[p.role]}</span>
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => deletePerson(p.id)}
                      style={{ height: 28, padding: '0 10px', borderRadius: 3, border: `1px solid ${colors.border}`, background: '#fff', color: colors.textSoft, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', justifySelf: 'end' }}
                    >
                      {t.people.remove}
                    </button>
                  )}
                </div>
              );
            })}
            {people.length === 0 && <div style={{ padding: '36px 24px', textAlign: 'center', fontSize: 12.5, color: colors.textSoft, lineHeight: 1.6 }}>{t.people.empty}</div>}
          </Card>
        </div>
      </AppShell>
    </ScreenGate>
  );
}
