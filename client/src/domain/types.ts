export type UnitType = 'FL' | 'RT' | 'TP' | 'RS' | 'RC' | 'BT' | 'CH';
export type UnitStatus = 'reported' | 'operational' | 'due' | 'maintenance' | 'vendor' | 'parts' | 'out';
export type Role = 'admin' | 'ops' | 'engineer' | 'operator';

export interface Person {
  id: string;
  name: string;
  role: Role;
  title: string;
}

export interface ServiceEvent {
  id: string;
  unitId: string;
  date: string;
  kind: 'preventive' | 'breakdown' | 'commission';
  title: string;
  desc: string;
  vendor: string;
  wo: string;
  cost: number | null;
}

export interface Part {
  id: string;
  unitId: string;
  name: string;
  qty: number;
  cost: number;
}

export interface Quote {
  id: string;
  unitId: string;
  company: string;
  scope: string;
  price: number;
  lead: number;
  note: string;
  awarded: boolean;
}

export interface Unit {
  id: string;
  type: UnitType;
  brand: string;
  model: string;
  serial: string;
  zone: string;
  hours: number;
  lastMeter: number;
  purchased: string | null;
  warranty: string | null;
  intervalHours: number;
  intervalMonths: number;
  lastService: string | null;
  nextService: string | null;
  partner: string;
  status: UnitStatus;

  complaint: string | null;
  reporter: string | null;
  channel: string | null;
  impact: string | null;
  reportedAt: string | null;

  issue: string | null;
  vendor: string | null;
  sent: string | null;
  eta: string | null;
  wo: string | null;
  cost: number | null;
  quoted: number | null;

  events: ServiceEvent[];
  parts: Part[];
  quotes: Quote[];
}

export interface Vendor {
  id: string;
  name: string;
  covers: string;
  contract: string;
  contact: string;
  role: string;
  phone: string;
  email: string;
  offers: string[];
  since: number | null;
  escalation: string;
  turnaround: string | null;
}
