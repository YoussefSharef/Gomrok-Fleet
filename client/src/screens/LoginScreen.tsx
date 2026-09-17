import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import type { Person } from '../domain/types';
import { colors } from '../styles/tokens';
import { Btn, Field, Select, TextInput } from '../components/ui';

export function LoginScreen() {
  const { t } = useI18n();
  const { login, loginError, clearLoginError } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    api.get<Person[]>('/auth/login-options').then(setPeople).catch(() => {});
  }, []);

  const firstRun = people.length === 1 && people[0].role === 'admin';

  const submit = () => {
    const who = name || people[0]?.name || '';
    if (!who || !pin.trim()) return;
    login(who, pin);
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div
        style={{
          width: 420,
          background: '#fff',
          borderRadius: 6,
          boxShadow: colors.modalShadow,
          padding: '32px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <img src="/assets/logo-navy.png" alt="Gomrok" style={{ height: 44, width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }} />
        <div>
          <div style={{ fontFamily: "'Funnel Display', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>{t.login.title}</div>
          <div style={{ fontSize: 12.5, color: colors.textSoft, marginTop: 4 }}>{t.login.sub}</div>
        </div>
        <Field label={t.login.who}>
          <Select
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearLoginError();
            }}
            style={{ height: 40 }}
          >
            <option value="">{t.login.pick}</option>
            {people.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} - {p.title || t.roles[p.role]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.login.pin}>
          <TextInput
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              clearLoginError();
            }}
            placeholder={t.login.pinPh}
            style={{ height: 40, fontSize: 15, fontFamily: "'Tektur', monospace", letterSpacing: '0.3em' }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        {loginError && (
          <div style={{ padding: '9px 12px', borderRadius: 3, background: colors.redBg, color: colors.red, fontSize: 12.5, fontWeight: 600 }}>
            {t.login.wrong}
          </div>
        )}
        <Btn variant="primary" onClick={submit} style={{ height: 42, fontSize: 14 }}>
          {t.login.signIn}
        </Btn>
        {firstRun && (
          <div style={{ padding: '11px 13px', borderRadius: 6, background: colors.bg, border: `1px solid ${colors.border}`, fontSize: 12, color: colors.textBody, lineHeight: 1.55 }}>
            {t.login.firstRun}
          </div>
        )}
      </div>
    </div>
  );
}
