import type { Dict } from '../i18n/types';
import type { UnitStatus, UnitType } from './types';

export const STATUS_ORDER: UnitStatus[] = ['reported', 'operational', 'due', 'maintenance', 'vendor', 'parts', 'out'];

export function statusMeta(t: Dict): Record<UnitStatus, { label: string; bg: string; fg: string }> {
  return {
    reported: { label: t.st.reported, bg: '#184478', fg: '#FFD203' },
    operational: { label: t.st.operational, bg: '#D1F0E0', fg: '#1E7B4B' },
    due: { label: t.st.due, bg: '#FFF0CC', fg: '#8B5E00' },
    maintenance: { label: t.st.maintenance, bg: '#D2DFEE', fg: '#184478' },
    vendor: { label: t.st.vendor, bg: '#E5E4DF', fg: '#2E2D28' },
    parts: { label: t.st.parts, bg: '#FDE5CC', fg: '#8A4B00' },
    out: { label: t.st.out, bg: '#FDDCDA', fg: '#8B1F1A' },
  };
}

export const HOURS_UNIT_TYPES: UnitType[] = ['BT', 'RC'];

export function hoursUnit(t: Dict, type: UnitType): string {
  return HOURS_UNIT_TYPES.includes(type) ? t.cycles : t.hrs;
}

export const KIND_COLORS: Record<'breakdown' | 'preventive' | 'commission', [string, string, string]> = {
  breakdown: ['#C0392B', '#FDDCDA', '#8B1F1A'],
  preventive: ['#1E7B4B', '#D1F0E0', '#1E7B4B'],
  commission: ['#184478', '#D2DFEE', '#184478'],
};

export const QR_BASE = 'https://gomrok.example/eq/';

export const UNIT_TYPES: UnitType[] = ['FL', 'RT', 'TP', 'RS', 'RC', 'BT', 'CH'];
