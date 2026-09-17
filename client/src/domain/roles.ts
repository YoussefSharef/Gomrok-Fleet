import type { Role } from './types';

export const ROLE_KEYS: Role[] = ['admin', 'ops', 'engineer', 'operator'];

export type ScreenKey = 'fleet' | 'add' | 'detail' | 'schedule' | 'vendors' | 'log' | 'people' | 'reports';

export const SCREEN_ROLES: Record<ScreenKey, Role[]> = {
  fleet: ROLE_KEYS,
  detail: ROLE_KEYS,
  schedule: ROLE_KEYS,
  reports: ROLE_KEYS,
  vendors: ['admin', 'ops', 'engineer'],
  add: ['admin', 'ops'],
  log: ['admin', 'ops', 'engineer'],
  people: ['admin'],
};

export function canSee(role: Role, screen: ScreenKey): boolean {
  return SCREEN_ROLES[screen].includes(role);
}
