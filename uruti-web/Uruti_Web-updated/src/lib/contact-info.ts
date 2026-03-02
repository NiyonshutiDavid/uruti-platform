export const SUPPORT_EMAIL = 'uruti.info@gmail.com';
export const SUPPORT_PHONE = '+250790636128';

export const supportMailtoLink = (subject?: string, body?: string) => {
  const query = new URLSearchParams();
  if (subject) query.set('subject', subject);
  if (body) query.set('body', body);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return `mailto:${SUPPORT_EMAIL}${suffix}`;
};
