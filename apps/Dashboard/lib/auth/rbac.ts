import type { Role } from './session';

export const ROLE_RANK: Record<Role, number> = {
  employee: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function hasMinRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
