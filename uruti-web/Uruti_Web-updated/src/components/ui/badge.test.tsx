import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders content with the data-slot marker', () => {
    render(<Badge>Founder</Badge>);

    const badge = screen.getByText('Founder');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Blocked</Badge>);

    const badge = screen.getByText('Blocked');
    expect(badge.className).toContain('bg-destructive');
    expect(badge.className).toContain('text-white');
  });
});