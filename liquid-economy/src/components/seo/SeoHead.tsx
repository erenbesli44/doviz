import { useEffect } from 'react';
import { SITE, absoluteUrl } from '../../seo/site';

interface Props {
  title?: string;
  description?: string;
  path: string;
  robots?: string;
  jsonLd?: object[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(id: string, schema: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(schema);
}

export default function SeoHead({
  title = SITE.defaultTitle,
  description = SITE.defaultDescription,
  path,
  robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
  jsonLd = [],
}: Props) {
  useEffect(() => {
    const canonical = absoluteUrl(path);
    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE.name);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', canonical);

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
    };
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/favicon.svg`,
    };

    setJsonLd('seo-schema-website', websiteSchema);
    setJsonLd('seo-schema-org', orgSchema);
    jsonLd.forEach((schema, idx) => setJsonLd(`seo-schema-page-${idx}`, schema));
  }, [description, jsonLd, path, robots, title]);

  return null;
}
