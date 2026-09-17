import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Person, Unit, Vendor } from '../domain/types';

export interface NewUnitInput {
  id: string;
  type: string;
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
}

export interface NewEventInput {
  date: string;
  kind: 'preventive' | 'breakdown';
  title: string;
  desc: string;
  vendor: string;
  wo: string;
  cost: number;
}

export interface ReportFaultInput {
  complaint: string;
  reporter: string;
  channel: string;
  impact: string;
}

export interface ReviewInput {
  decision: 'approve' | 'reject';
  sendOut: boolean;
  wo: string;
  parts: { name: string; qty: number; cost: number }[];
  quotes: { company: string; scope: string; price: number; lead: number; note: string; awarded: boolean }[];
  fallbackVendor: string;
  inHouseName: string;
  defaultPartName: string;
  defaultComplaint: string;
  confirmedPrefix: string;
}

export interface NewVendorInput {
  name: string;
  covers: string;
  contract: string;
  contact: string;
  role: string;
  phone: string;
  email: string;
  offers: string[];
}

export interface NewPersonInput {
  name: string;
  role: string;
  title: string;
  pin: string;
}

interface DataContextValue {
  units: Unit[];
  vendors: Vendor[];
  people: Person[];
  loading: boolean;
  refresh: () => Promise<void>;
  createUnit: (input: NewUnitInput) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<void>;
  addServiceEvent: (unitId: string, input: NewEventInput) => Promise<void>;
  reportFault: (unitId: string, input: ReportFaultInput) => Promise<void>;
  reviewFault: (unitId: string, input: ReviewInput) => Promise<void>;
  createVendor: (input: NewVendorInput) => Promise<Vendor>;
  createPerson: (input: NewPersonInput) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  exportData: () => Promise<{ units: Unit[]; vendors: Vendor[] }>;
  importData: (data: { units: unknown[]; vendors: unknown[] }) => Promise<void>;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { person } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    try {
      const [u, v, p] = await Promise.all([
        api.get<Unit[]>('/units'),
        api.get<Vendor[]>('/vendors'),
        api.get<Person[]>('/people'),
      ]);
      setUnits(u);
      setVendors(v);
      setPeople(p);
    } finally {
      setLoading(false);
    }
  }, [person]);

  useEffect(() => {
    if (person) refresh();
    else {
      setUnits([]);
      setVendors([]);
      setPeople([]);
      setLoading(false);
    }
  }, [person, refresh]);

  const value: DataContextValue = {
    units,
    vendors,
    people,
    loading,
    refresh,
    createUnit: async (input) => {
      const unit = await api.post<Unit>('/units', input);
      await refresh();
      return unit;
    },
    deleteUnit: async (id) => {
      await api.delete(`/units/${encodeURIComponent(id)}`);
      await refresh();
    },
    addServiceEvent: async (unitId, input) => {
      await api.post(`/units/${encodeURIComponent(unitId)}/events`, input);
      await refresh();
    },
    reportFault: async (unitId, input) => {
      await api.post(`/units/${encodeURIComponent(unitId)}/report-fault`, input);
      await refresh();
    },
    reviewFault: async (unitId, input) => {
      await api.post(`/units/${encodeURIComponent(unitId)}/review`, input);
      await refresh();
    },
    createVendor: async (input) => {
      const vendor = await api.post<Vendor>('/vendors', input);
      await refresh();
      return vendor;
    },
    createPerson: async (input) => {
      const p = await api.post<Person>('/people', input);
      await refresh();
      return p;
    },
    deletePerson: async (id) => {
      await api.delete(`/people/${id}`);
      await refresh();
    },
    exportData: () => api.get('/data/export'),
    importData: async (data) => {
      await api.post('/data/import', data);
      await refresh();
    },
    selectedUnitId,
    setSelectedUnitId,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
