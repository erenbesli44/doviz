import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

// Many pages set their final <title> only after their data loads, so a
// page_view sent on navigation would carry the default or the previous
// page's title. Wait until the title has been stable for SETTLE_MS (and has
// changed from the last title we sent), but never longer than MAX_WAIT_MS.
const SETTLE_MS = 1000;
const MAX_WAIT_MS = 5000;
// React StrictMode (dev) mounts, tears down and re-mounts effects at once;
// a teardown that fast is not a real navigation, so it must not send.
const MIN_LIFETIME_MS = 300;
let lastSentTitle = '';

export function usePageTracking(): void {
  const location = useLocation();
  const path = location.pathname + location.search;

  useEffect(() => {
    let sent = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();

    const send = () => {
      if (sent) return;
      sent = true;
      lastSentTitle = document.title;
      trackPageView(path);
    };
    const schedule = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        // Title still equals the previous page's: keep waiting, up to the cap.
        if (document.title === lastSentTitle && Date.now() - started < MAX_WAIT_MS) schedule();
        else send();
      }, SETTLE_MS);
    };

    const titleEl = document.querySelector('title');
    const observer = titleEl ? new MutationObserver(schedule) : null;
    if (titleEl) observer?.observe(titleEl, { childList: true, characterData: true, subtree: true });
    const cap = setTimeout(send, MAX_WAIT_MS);
    window.addEventListener('pagehide', send);
    schedule();

    return () => {
      // Leaving the route before the title settled: count the view now.
      if (Date.now() - started >= MIN_LIFETIME_MS) send();
      clearTimeout(settle);
      clearTimeout(cap);
      observer?.disconnect();
      window.removeEventListener('pagehide', send);
    };
  }, [path]);
}
