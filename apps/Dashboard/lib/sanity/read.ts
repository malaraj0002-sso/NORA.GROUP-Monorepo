import 'server-only';
import { mockData } from '@/lib/mock-data';
import type { AdminData, Service } from '@/lib/types';
import { fetchSanityQuery } from './fetch';
import { isForbiddenDoorService, mapQueryResultToAdminData } from './map';
import { DASHBOARD_READ_QUERY } from './queries';
import type { SanityDashboardQueryResult } from './readTypes';

export type DashboardContentSource = 'sanity' | 'mock';

export type DashboardContentBundle = {
  source: DashboardContentSource;
  data: AdminData;
  reason?: string;
};

function stripDoorServices(data: AdminData): AdminData {
  return {
    ...data,
    services: data.services.filter(
      (s: Service) => !isForbiddenDoorService({ id: s.id, icon: s.icon, title: s.title }),
    ),
  };
}

/**
 * Server-only read. Sanity success → mapped CMS data only (no mock merge).
 * Failure / unconfigured → mock fallback with doors stripped from services.
 */
export async function readDashboardContent(): Promise<DashboardContentBundle> {
  const fetched = await fetchSanityQuery<SanityDashboardQueryResult>(DASHBOARD_READ_QUERY);

  if (!fetched.ok) {
    console.error('[dashboard-read]', fetched.reason);
    return {
      source: 'mock',
      data: stripDoorServices(mockData),
      reason: fetched.reason,
    };
  }

  if (fetched.data == null || typeof fetched.data !== 'object') {
    console.error('[dashboard-read] missing document payload');
    return {
      source: 'mock',
      data: stripDoorServices(mockData),
      reason: 'Sanity returned no document payload',
    };
  }

  try {
    return {
      source: 'sanity',
      data: mapQueryResultToAdminData(fetched.data),
    };
  } catch {
    console.error('[dashboard-read] mapping failed');
    return {
      source: 'mock',
      data: stripDoorServices(mockData),
      reason: 'Sanity payload could not be mapped',
    };
  }
}
