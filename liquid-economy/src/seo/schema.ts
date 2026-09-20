import { SITE, absoluteUrl } from './site';

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** An article that summarises a third-party video — `isBasedOn` credits the source. */
export function articleSchema(a: {
  path: string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string | null;
  dateModified?: string | null;
  sourceName?: string;
  sourceUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.headline,
    description: a.description,
    inLanguage: 'tr-TR',
    mainEntityOfPage: absoluteUrl(a.path),
    ...(a.image ? { image: [a.image] } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    isBasedOn: { '@type': 'VideoObject', url: a.sourceUrl, ...(a.sourceName ? { author: a.sourceName } : {}) },
  };
}

export function collectionPageSchema(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'tr-TR',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
    },
  };
}
