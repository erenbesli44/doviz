import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// location.key → last scroll offset. Module scope: survives route changes, not reloads.
const positions = new Map<string, number>();

/**
 * Reader-friendly scroll behaviour for the SPA:
 *  - new page (link click)  → start at the top
 *  - back / forward         → return to where the reader was
 */
export default function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const keyRef = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const save = () => positions.set(keyRef.current, window.scrollY);
    // `scroll` alone is not enough: browsers skip it (and rAF) while a tab is not being
    // rendered. click/popstate fire just before the route changes, while the old page
    // is still in place — capture there too.
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('popstate', save, true);
    document.addEventListener('click', save, true);
    return () => {
      window.removeEventListener('scroll', save);
      window.removeEventListener('popstate', save, true);
      document.removeEventListener('click', save, true);
    };
  }, []);

  useLayoutEffect(() => {
    const saved = positions.get(location.key);
    keyRef.current = location.key;

    if (navType !== 'POP' || saved == null) {
      if (!location.hash) window.scrollTo(0, 0);
      return;
    }

    // Usually lands first try (feeds render from cache); retry briefly if content is still growing.
    let tries = 0;
    let timer = 0;
    const restore = () => {
      window.scrollTo(0, saved);
      if (Math.abs(window.scrollY - saved) > 2 && tries++ < 30) timer = window.setTimeout(restore, 50);
    };
    restore();
    return () => window.clearTimeout(timer);
  }, [location.key, location.hash, navType]);

  return null;
}
