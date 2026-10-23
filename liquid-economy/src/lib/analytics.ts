const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initAnalytics(): void {
  if (!MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // send_page_view: false — we fire page views manually on route changes
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  // One delegated listener covers every video and person link on the site.
  document.addEventListener('click', trackLinkClick, { capture: true });
  document.addEventListener('auxclick', trackLinkClick, { capture: true });
}

export function trackPageView(path: string): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.origin + path,
  });
}

export function trackEvent(name: string, params: Record<string, string | number>): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

const YOUTUBE = /^(www\.|m\.)?(youtube\.com|youtu\.be)$/;

/**
 * video_click  — any link to a YouTube video ("Videoda izle", story source video).
 *                Params: link_url, start_sec (0 when no timestamp), person (data-person if set).
 * person_click — any internal link to an expert page /uzmanlar/<slug>.
 *                Params: person_slug, link_text.
 * GA adds page_location itself, which tells where the click happened.
 */
function trackLinkClick(e: MouseEvent): void {
  if (e.type === 'auxclick' && e.button !== 1) return; // only middle-click opens a tab
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return;
  let url: URL;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return;
  }

  if (YOUTUBE.test(url.hostname)) {
    const t = url.searchParams.get('t') ?? '';
    trackEvent('video_click', {
      link_url: url.href,
      start_sec: Number.parseInt(t, 10) || 0,
      person: a.dataset.person ?? '',
    });
    return;
  }

  const m = url.origin === window.location.origin && url.pathname.match(/^\/uzmanlar\/([^/]+)\/?$/);
  if (m) {
    trackEvent('person_click', {
      person_slug: decodeURIComponent(m[1]),
      link_text: (a.textContent ?? '').trim().slice(0, 100),
    });
  }
}
