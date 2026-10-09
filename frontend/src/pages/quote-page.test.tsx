import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuotePage } from './quote-page.tsx';

const body = { id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: 'Walt Disney' };

afterEach(() => vi.unstubAllGlobals());

describe('QuotePage', () => {
  it('shows a skeleton first, then the quote', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    const { container } = render(<QuotePage />);
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(await screen.findByText(body.quote)).toBeInTheDocument();
    expect(screen.getByText('— Walt Disney')).toBeInTheDocument();
    expect(container.querySelector('.skeleton')).toBeNull();
  });

  it('is a centered column with a 640px max card and no title or controls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    const { container } = render(<QuotePage />);
    await screen.findByText(body.quote);
    const main = container.firstElementChild as HTMLElement;
    expect(main.className).toMatch(/min-h-screen/);
    expect(main.className).toMatch(/items-center/);
    expect(main.className).toMatch(/justify-center/);
    expect(main.firstElementChild?.className).toMatch(/max-w-\[640px\]/);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
