import { createClient, type SanityClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

export const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: 'published',
    })
  : null;
