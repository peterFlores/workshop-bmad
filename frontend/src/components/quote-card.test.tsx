import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuoteCard } from './quote-card.tsx';

const quote = { id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: 'Walt Disney' };

const next = { id: 7, quote: 'Another Quote, Same Card', author: 'Someone Else' };

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduce && q.includes('prefers-reduced-motion'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => stubMotion(false));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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

  it('announces "Loading a new quote" in the live region while loading, first load included', () => {
    const { rerender } = render(<QuoteCard quote={null} status="loading" />);
    const region = screen.getByTestId('quote-region');
    expect(region).toHaveTextContent('Loading a new quote');
    rerender(<QuoteCard quote={quote} status="ready" />);
    expect(region).not.toHaveTextContent('Loading a new quote');
  });

  it('keeps the previous quote and shows no skeleton on a repeat load', () => {
    const { container } = render(<QuoteCard quote={quote} status="loading" />);
    expect(container.querySelector('.skeleton')).toBeNull();
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
    expect(screen.getByTestId('quote-region')).toHaveTextContent('Loading a new quote');
  });

  it('fades the old text out for 150 ms, swaps, then fades the new text in', () => {
    vi.useFakeTimers();
    const { rerender } = render(<QuoteCard quote={quote} status="loading" />);
    rerender(<QuoteCard quote={next} status="ready" />);
    const wrapper = screen.getByTestId('quote-fade');
    expect(wrapper).toHaveAttribute('data-phase', 'out');
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText(quote.quote)).toBeNull();
    expect(screen.getByText(next.quote)).toBeInTheDocument();
    expect(screen.getByText('— Someone Else')).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('data-phase', 'idle');
  });

  it('swaps instantly under prefers-reduced-motion', () => {
    stubMotion(true);
    vi.useFakeTimers();
    const { rerender } = render(<QuoteCard quote={quote} status="loading" />);
    rerender(<QuoteCard quote={next} status="ready" />);
    expect(screen.getByText(next.quote)).toBeInTheDocument();
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'idle');
  });

  it('completes the swap when the same quote arrives again as a new object', () => {
    vi.useFakeTimers();
    const { rerender } = render(<QuoteCard quote={quote} status="loading" />);
    rerender(<QuoteCard quote={{ ...quote }} status="ready" />);
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'out');
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'idle');
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
  });

  it('shows the first quote without a fade phase when coming from the skeleton', () => {
    const { rerender } = render(<QuoteCard quote={null} status="loading" />);
    rerender(<QuoteCard quote={quote} status="ready" />);
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'idle');
  });

  it('returns to idle when the quote goes A -> B -> A during the fade-out', () => {
    vi.useFakeTimers();
    const { rerender } = render(<QuoteCard quote={quote} status="loading" />);
    rerender(<QuoteCard quote={next} status="ready" />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<QuoteCard quote={quote} status="ready" />);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'idle');
    expect(screen.getByText(quote.quote)).toBeInTheDocument();
  });

  it('ends on C when the quote goes A -> B -> C during the fade-out', () => {
    vi.useFakeTimers();
    const third = { id: 3, quote: 'Third Quote', author: 'Third Author' };
    const { rerender } = render(<QuoteCard quote={quote} status="loading" />);
    rerender(<QuoteCard quote={next} status="ready" />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<QuoteCard quote={third} status="ready" />);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByTestId('quote-fade')).toHaveAttribute('data-phase', 'idle');
    expect(screen.getByText(third.quote)).toBeInTheDocument();
  });
});
