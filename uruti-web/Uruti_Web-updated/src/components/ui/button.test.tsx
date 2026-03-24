import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renders button text and default attributes', () => {
    render(<Button>Launch</Button>);

    const button = screen.getByRole('button', { name: 'Launch' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button.className).toContain('bg-primary');
  });

  it('renders destructive variant styling', () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('text-white');
  });
});