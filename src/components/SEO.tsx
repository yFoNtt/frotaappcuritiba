import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = 'FrotaApp';
const DEFAULT_OG_IMAGE = '/og-image.png';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Helper to set or create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('name', 'description', description);

    // Robots
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    }

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage || DEFAULT_OG_IMAGE);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (canonical) {
      setMeta('property', 'og:url', canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`);
    }

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage || DEFAULT_OG_IMAGE);

    // Canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`);
    }

    // JSON-LD
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach((s) => s.remove());

    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach((schema) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    // Cleanup JSON-LD on unmount
    return () => {
      const scripts = document.querySelectorAll('script[data-seo-jsonld]');
      scripts.forEach((s) => s.remove());
    };
  }, [title, description, canonical, ogImage, ogType, noindex, jsonLd]);

  return null;
}
