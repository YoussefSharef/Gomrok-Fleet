import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../layout/AppShell';
import { ScreenGate } from '../layout/ScreenGate';
import { useI18n } from '../i18n';
import { useData } from '../data/DataContext';
import { UNIT_TYPES } from '../domain/status';
import type { UnitType } from '../domain/types';
import { Btn, Card, Field, Select, TextInput } from '../components/ui';
import { colors, fonts } from '../styles/tokens';

interface FormState {
  type: UnitType;
  id: string;
  zone: string;
  brand: string;
  model: string;
  serial: string;
  purchased: string;
  warranty: string;
  hours: string;
  lastMeter: string;
  intervalHours: string;
  intervalMonths: string;
  lastService: string;
  nextService: string;
  partner: string;
}

const blank = (keep?: Partial<FormState>): FormState => ({
  type: keep?.type || 'FL',
  id: '',
  zone: keep?.zone || '',
  brand: keep?.brand || '',
  model: keep?.model || '',
  serial: '',
  purchased: '',
  warranty: '',
  hours: '',
  lastMeter: '',
  intervalHours: keep?.intervalHours || '',
  intervalMonths: keep?.intervalMonths || '',
  lastService: '',
  nextService: '',
  partner: keep?.partner || '',
});

export function AddEquipmentScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { units, createUnit } = useData();
  const [form, setForm] = useState<FormState>(blank());
  const [error, setError] = useState('');

  const typeCount = (ty: UnitType) => units.filter((u) => u.type === ty).length;
  const suggestedId = useMemo(() => `${form.type}-${String(typeCount(form.type) + 1).padStart(2, '0')}`, [form.type, units]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (andContinue: boolean) => {
    setError('');
    const id = (form.id || suggestedId).trim().toUpperCase();
    if (!form.serial.trim() && !form.brand.trim()) {
      setError('Enter at least a brand or serial number.');
      return;
    }
    if (units.some((u) => u.id === id)) {
      setError('An asset with that ID already exists.');
      return;
    }
    try {
      await createUnit({
        id,
        type: form.type,
        brand: form.brand.trim(),
        model: form.model.trim(),
        serial: form.serial.trim(),
        zone: form.zone.trim(),
        hours: +form.hours || 0,
        lastMeter: +form.lastMeter || 0,
        purchased: form.purchased || null,
        warranty: form.warranty || null,
        intervalHours: +form.intervalHours || 0,
        intervalMonths: +form.intervalMonths || 0,
        lastService: form.lastService || null,
        nextService: form.nextService || null,
        partner: form.partner.trim(),
      });
      if (andContinue) {
        setForm(blank({ type: form.type, zone: form.zone, partner: form.partner, intervalHours: form.intervalHours, intervalMonths: form.intervalMonths }));
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this asset.');
    }
  };

  return (
    <ScreenGate screen="add">
      <AppShell screen="add">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,720px) 300px', gap: 18, alignItems: 'start' }}>
          <Card padding="24px 28px" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 17 }}>New equipment record</div>
              <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 3 }}>
                Only brand or serial is required — you can fill the rest in later. Saving keeps the type, brand, zone and plan ready for the next unit.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => set('type', e.target.value as UnitType)}>
                  {UNIT_TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {t.types[ty]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Asset ID">
                <TextInput value={form.id} onChange={(e) => set('id', e.target.value)} placeholder={suggestedId} style={{ fontFamily: fonts.mono }} />
              </Field>
              <Field label="Zone / location">
                <TextInput value={form.zone} onChange={(e) => set('zone', e.target.value)} placeholder="e.g. Dry A, Frozen F · Aisle 2" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 14 }}>
              <Field label="Brand">
                <TextInput value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Yale, Still, CAT" />
              </Field>
              <Field label="Model">
                <TextInput value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="e.g. ERP30VL" />
              </Field>
              <Field label="Serial number">
                <TextInput value={form.serial} onChange={(e) => set('serial', e.target.value)} placeholder="As shown on the nameplate" style={{ fontFamily: fonts.mono }} />
              </Field>
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
              <Field label="Purchase date">
                <TextInput type="date" value={form.purchased} onChange={(e) => set('purchased', e.target.value)} />
              </Field>
              <Field label="Warranty ends">
                <TextInput type="date" value={form.warranty} onChange={(e) => set('warranty', e.target.value)} />
              </Field>
              <Field label="Hour meter / cycles now">
                <TextInput value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="0" style={{ fontFamily: fonts.mono }} />
              </Field>
              <Field label="Meter at last service">
                <TextInput value={form.lastMeter} onChange={(e) => set('lastMeter', e.target.value)} placeholder="0" style={{ fontFamily: fonts.mono }} />
              </Field>
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textBody }}>
                Preventive maintenance plan <span style={{ color: colors.textMuted, fontWeight: 400 }}>— leave blank if not set yet</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
                <Field label="Every … hours">
                  <TextInput value={form.intervalHours} onChange={(e) => set('intervalHours', e.target.value)} placeholder="500" style={{ fontFamily: fonts.mono }} />
                </Field>
                <Field label="Every … months">
                  <TextInput value={form.intervalMonths} onChange={(e) => set('intervalMonths', e.target.value)} placeholder="3" style={{ fontFamily: fonts.mono }} />
                </Field>
                <Field label="Last service">
                  <TextInput type="date" value={form.lastService} onChange={(e) => set('lastService', e.target.value)} />
                </Field>
                <Field label="Next due">
                  <TextInput type="date" value={form.nextService} onChange={(e) => set('nextService', e.target.value)} />
                </Field>
              </div>
            </div>

            <Field label="Service partner">
              <TextInput value={form.partner} onChange={(e) => set('partner', e.target.value)} placeholder="Company that normally services this unit" />
            </Field>

            {error && <div style={{ color: colors.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 11.5, color: colors.textSoft, flex: 1 }}>Saved to the server. Use Export in the top bar to keep a backup file.</div>
              <Btn variant="secondary" onClick={() => navigate('/')}>Done</Btn>
              <Btn variant="primary" onClick={() => save(true)}>Save & add another</Btn>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: colors.blue, borderRadius: 6, padding: '18px 20px', color: '#fff' }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.yellow, marginBottom: 8 }}>Assets entered</div>
              <div style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{units.length}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>in your register so far</div>
            </div>
            <Card padding="18px 20px">
              <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Before you start</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Work through one equipment type at a time — all forklifts, then all reach trucks.',
                  'Serial numbers come off the nameplate; they are what the maintenance company asks for.',
                  'Service intervals are in the manufacturer manual — hours, months, or both.',
                  'Batteries and chargers count as assets: they need service and they fail.',
                  'Export a backup when you finish each session.',
                ].map((tip) => (
                  <div key={tip} style={{ display: 'flex', gap: 9, fontSize: 12, lineHeight: 1.5, color: colors.textBody }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.yellow, flexShrink: 0, marginTop: 7 }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </ScreenGate>
  );
}
