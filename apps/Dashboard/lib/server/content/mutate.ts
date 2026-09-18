/**
 * Dashboard CMS mutations now write PostgreSQL (Phase 3).
 * The previous Sanity writer remains at lib/sanity/write.ts for rollback/reference.
 */
export { applyMutation } from '@/lib/server/content/postgres/mutate';
export type { ApplyMutationResult, ApplyMutationContext } from '@/lib/server/content/postgres/mutate';
