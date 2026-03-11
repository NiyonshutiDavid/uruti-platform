import config from './config';

const apiOrigin = config.apiUrl.replace(/\/+$/, '');

export function resolveMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    // Strip localhost/127.0.0.1 origins so Netlify proxy handles the path
    try {
      const parsed = new URL(raw);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return parsed.pathname + parsed.search;
      }
    } catch {
      // Not a valid URL — fall through and return as-is
    }
    return raw;
  }

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${apiOrigin}${normalized}`;
}
