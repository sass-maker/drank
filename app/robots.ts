import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: ['/llms.txt', '/index.md', '/api/ai', '/openapi.json', '/llms-full.txt'],
      },
    ],
    sitemap: 'https://domains.sassmaker.com/sitemap.xml',
  };
}
