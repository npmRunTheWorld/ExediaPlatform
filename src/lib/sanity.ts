import 'server-only';
import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { env } from './env';

let client: SanityClient | null = null;

// One client for reads and writes. It lives on the server, so the token never
// reaches the browser bundle.
export function sanity(): SanityClient {
  if (!client) {
    client = createClient({
      projectId: env.sanityProjectId,
      dataset: env.sanityDataset,
      apiVersion: '2025-02-19',
      useCdn: false,
      token: env.sanityWriteToken,
      perspective: 'published',
    });
  }
  return client;
}

export function imageUrl(source: unknown) {
  return createImageUrlBuilder(sanity()).image(source as never);
}
