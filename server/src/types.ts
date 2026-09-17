export const ROLE_KEYS = ['admin', 'ops', 'engineer', 'operator'] as const;
export type Role = (typeof ROLE_KEYS)[number];

export const SCREEN_ROLES: Record<string, readonly Role[]> = {
  fleet: ROLE_KEYS,
  detail: ROLE_KEYS,
  schedule: ROLE_KEYS,
  reports: ROLE_KEYS,
  vendors: ['admin', 'ops', 'engineer'],
  add: ['admin', 'ops'],
  log: ['admin', 'ops', 'engineer'],
  people: ['admin'],
};

export interface AuthedPerson {
  id: string;
  name: string;
  role: Role;
  title: string;
}
