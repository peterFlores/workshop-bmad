import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuoteCard } from './quote-card.tsx';

const quote = { id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: 'Walt Disney' };

afterEach(() => vi.unstubAllGlobals());

describe('QuoteCard', () => {
  it('shows a skeleton and no text while loading, inside a polite live region', () => {
    const { container } = render(<QuoteCard quote={null} status="loading" />);
    const region = screen.getByTestId('quote-region');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(screen.queryByText(/Walt/)).toBeNull();
  });

  it('renders quote and em-dash author as exact text when ready', () => {
    const { container } = render(<QuoteCard quote={quote} status="ready" />);
    expect(screen.getByTestId('quote-region')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText("That'S The Real Trouble With The World, Too Many People Grow Up")).toBeInTheDocument();
    expect(screen.getByText('— Walt Disney')).toBeInTheDocument();
    expect(container.querySelector('.skeleton')).toBeNull();
  });

  it('applies no text-transform', () => {
    const { container } = render(<QuoteCard quote={quote} status="ready" />);
    for (const el of container.querySelectorAll('*')) {
      expect(getComputedStyle(el).textTransform).not.toMatch(/uppercase|lowercase|capitalize/);
      expect((el as HTMLElement).className).not.toMatch(/uppercase|lowercase|capitalize/);
    }
  });

  it('never calls fetch', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<QuoteCard quote={quote} status="ready" />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
