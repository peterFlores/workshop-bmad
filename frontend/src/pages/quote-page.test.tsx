import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('is a centered column with a 640px max card and no title and a single button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    const { container } = render(<QuotePage />);
    await screen.findByText(body.quote);
    const main = container.firstElementChild as HTMLElement;
    expect(main.className).toMatch(/min-h-screen/);
    expect(main.className).toMatch(/items-center/);
    expect(main.className).toMatch(/justify-center/);
    expect(main.firstElementChild?.className).toMatch(/max-w-\[640px\]/);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('fetches a new quote on one click: old quote stays while pending, then the new one appears', async () => {
    const second = { id: 9, quote: 'A Second Quote', author: 'Ada Lovelace' };
    let resolveSecond!: (r: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(body)))
      .mockReturnValueOnce(new Promise<Response>((r) => (resolveSecond = r)));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<QuotePage />);
    await screen.findByText(body.quote);
    const button = screen.getByRole('button', { name: 'New quote' });
    button.focus();

    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const loading = await screen.findByRole('button', { name: /Loading\.\.\./ });
    expect(loading).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(body.quote)).toBeInTheDocument();
    expect(container.querySelector('.skeleton')).toBeNull();
    fireEvent.click(loading);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => resolveSecond(new Response(JSON.stringify(second))));
    expect(await screen.findByText(second.quote)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New quote' })).toBeEnabled();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows an identical second quote again without error', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body))));
    vi.stubGlobal('fetch', fetchMock);
    render(<QuotePage />);
    await screen.findByText(body.quote);
    fireEvent.click(screen.getByRole('button', { name: 'New quote' }));
    expect(await screen.findByRole('button', { name: 'New quote' })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText(body.quote)).toBeInTheDocument();
  });
});
