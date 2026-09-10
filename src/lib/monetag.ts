import { auth } from './firebase';

/**
 * Monetag In-Page Push (Zone 11767716) Lifecycle Manager
 * Ensures the ad is only active on WelcomePage for unauthenticated users,
 * and is aggressively purged upon sign-in and across all authenticated views.
 */

const ZONE_ID = '11767716';
const SCRIPT_URL_PART = 'nap5k.com';

let injectedScriptEl: HTMLScriptElement | null = null;

export function initMonetagInPagePush(targetContainer?: HTMLElement | null): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Never initialize if user is already authenticated
  if (auth.currentUser) {
    cleanupMonetagInPagePush();
    return;
  }

  // Prevent duplicate script tags
  if (
    document.querySelector(`script[data-zone="${ZONE_ID}"]`) ||
    document.querySelector(`script[src*="${SCRIPT_URL_PART}"]`) ||
    document.getElementById('monetag-inpage-push-script')
  ) {
    return;
  }

  try {
    const s = document.createElement('script');
    s.id = 'monetag-inpage-push-script';
    s.dataset.zone = ZONE_ID;
    s.src = 'https://nap5k.com/tag.min.js';
    s.setAttribute('data-cfasync', 'false');
    s.async = true;

    const target = targetContainer || [document.documentElement, document.body].filter(Boolean).pop();
    if (target) {
      target.appendChild(s);
      injectedScriptEl = s;
    }
  } catch (err) {
    console.warn('[Monetag] Failed to initialize In-Page Push script:', err);
  }
}

export function cleanupMonetagInPagePush(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // 1. Remove tracked script element
    if (injectedScriptEl && injectedScriptEl.parentNode) {
      injectedScriptEl.parentNode.removeChild(injectedScriptEl);
      injectedScriptEl = null;
    }

    // 2. Remove all Monetag script tags from the entire document
    const scripts = document.querySelectorAll(
      `script[data-zone="${ZONE_ID}"], script[src*="${SCRIPT_URL_PART}"], script[src*="5gvci.com"], #monetag-inpage-push-script`
    );
    scripts.forEach((el) => el.remove());

    // 3. Remove all DOM elements created by Monetag In-Page Push
    const adSelectors = [
      `[data-zone="${ZONE_ID}"]`,
      `[data-zone="11767338"]`,
      `[id*="monetag"]`,
      `[class*="monetag"]`,
      `[id*="nap5k"]`,
      `[class*="nap5k"]`,
      `iframe[src*="nap5k"]`,
      `iframe[src*="5gvci"]`,
      `div[id^="_ipp_"]`,
      `div[id^="ipp_"]`,
      `div[class^="ipp_"]`,
      `div[class*="inpage-push"]`,
      `div[id*="inpage_push"]`,
      `div[id*="zone_${ZONE_ID}"]`
    ];

    adSelectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.id === 'monetag-inpage-push-wrapper' || el.id === 'monetag-zone-11767716') {
            el.innerHTML = '';
          } else {
            el.remove();
          }
        });
      } catch {
        // ignore selector error
      }
    });

    // 4. Remove any floating or fixed overlay nodes spawned on body with ad content
    const bodyChildren = Array.from(document.body.children);
    for (const child of bodyChildren) {
      if (child.id === 'root' || child.id === 'monetag-inpage-push-wrapper') continue;
      const html = child.outerHTML || '';
      if (
        html.includes(ZONE_ID) ||
        html.includes(SCRIPT_URL_PART) ||
        html.includes('5gvci.com') ||
        html.includes('inpage') ||
        html.includes('monetag')
      ) {
        child.remove();
      }
    }

    // 5. Clean up window globals if Monetag attached any
    try {
      const win = window as any;
      if (win._monetag) delete win._monetag;
      if (win._inpagePush) delete win._inpagePush;
      if (win._nap5k) delete win._nap5k;
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('[Monetag] Cleanup error:', err);
  }
}
