import { describe, expect, it } from 'vitest';

import { SUPPORT_EMAIL, supportMailtoLink } from './contact-info';

describe('supportMailtoLink', () => {
  it('returns base mailto link without query parameters', () => {
    expect(supportMailtoLink()).toBe(`mailto:${SUPPORT_EMAIL}`);
  });

  it('encodes subject and body query parameters', () => {
    expect(supportMailtoLink('Need Help', 'Line one\nLine two')).toBe(
      `mailto:${SUPPORT_EMAIL}?subject=Need+Help&body=Line+one%0ALine+two`,
    );
  });
});