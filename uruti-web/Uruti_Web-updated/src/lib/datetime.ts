export function parseServerDate(value?: string | number | Date | null): Date {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'number') {
    const fromMs = new Date(value);
    return Number.isNaN(fromMs.getTime()) ? new Date(0) : fromMs;
  }

  const raw = String(value || '').trim();
  if (!raw) return new Date(0);

  // Keep date-only strings in local timezone, but force UTC for date-time
  // payloads that arrive without an explicit offset.
  const hasTimezone = /z$|[+-]\d{2}:?\d{2}$/i.test(raw);
  const normalized = raw.includes('T') && !hasTimezone ? `${raw}Z` : raw;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export function toEpochMs(value?: string | number | Date | null): number {
  const ms = parseServerDate(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function formatLocalDate(
  value?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = '',
): string {
  const parsed = parseServerDate(value);
  if (parsed.getTime() === 0 && String(value || '').trim() === '') return fallback;
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(undefined, options);
}

export function formatLocalTime(
  value?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = '',
): string {
  const parsed = parseServerDate(value);
  if (parsed.getTime() === 0 && String(value || '').trim() === '') return fallback;
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleTimeString(undefined, options);
}

export function formatLocalDateTime(
  value?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = '',
): string {
  const parsed = parseServerDate(value);
  if (parsed.getTime() === 0 && String(value || '').trim() === '') return fallback;
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString(undefined, options);
}

export function formatRelativeTime(value?: string | number | Date | null): string {
  const parsed = parseServerDate(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) return '';

  const diff = Date.now() - parsed.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return parsed.toLocaleDateString();
}
