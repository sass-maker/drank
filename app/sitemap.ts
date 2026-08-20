import type { MetadataRoute } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-static';

type AgentCatalog = {
  surfaces?: Array<{
    url?: string;
  }>;
};

function loadPublicUrls(): string[] {
  try {
    const path = join(process.cwd(), 'public/api-ai.json');
    const catalog = JSON.parse(readFileSync(path, 'utf8')) as AgentCatalog;
    return (catalog.surfaces ?? [])
      .map((surface) => surface.url)
      .filter((url): url is string => typeof url === 'string');
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return loadPublicUrls().map((url) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url,
      changeFrequency: 'weekly',
      priority: 0.7,
    };

    if (new URL(url).pathname === '/') {
      entry.changeFrequency = 'daily';
      entry.priority = 1;
    }

    return entry;
  });
}
