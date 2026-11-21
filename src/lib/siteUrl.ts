/**
 * Centralized public site URL and agent store link generation helper.
 * Enforces production base domain https://kingjdeals.site (or VITE_PUBLIC_SITE_URL)
 * and prevents generation of localhost or temporary preview links for customer-facing URLs.
 */

export function getPublicSiteUrl(): string {
  let envUrl = '';
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      envUrl = (import.meta as any).env.VITE_PUBLIC_SITE_URL || (import.meta as any).env.VITE_SITE_URL || '';
    }
  } catch {}

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://kingjdeals.site';
}

export function getAgentStoreUrl(slug?: string): string {
  const base = getPublicSiteUrl();
  const cleanSlug = (slug || '').trim().replace(/^\/+/, '');
  if (!cleanSlug) return base;
  return `${base}/store/${cleanSlug}`;
}
