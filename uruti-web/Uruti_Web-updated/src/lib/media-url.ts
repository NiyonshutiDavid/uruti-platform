import config from './config';

const apiOrigin = config.apiUrl.replace(/\/+$/, '');

export function resolveMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${apiOrigin}${normalized}`;
}
