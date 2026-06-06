import type { MetadataRoute } from 'next';

const DEFAULT_SITE_URL = 'http://localhost:3000';

const staticRoutes = [
  {
    path: '/',
    priority: 1,
  },
  {
    path: '/resources',
    priority: 0.8,
  },
  {
    path: '/resources/search',
    priority: 0.6,
  },
  {
    path: '/privacy',
    priority: 0.3,
  },
  {
    path: '/terms',
    priority: 0.3,
  },
] satisfies Array<{
  path: string;
  priority: number;
}>;

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;

  return siteUrl.replace(/\/$/, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route.priority,
  }));
}
