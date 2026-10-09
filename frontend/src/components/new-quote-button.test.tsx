import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewQuoteButton } from './new-quote-button.tsx';

describe('NewQuoteButton', () => {
  it('is an enabled native button labelled "New quote" when idle', () => {
    render(<NewQuoteButton isLoading={false} onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'New quote' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onPress on click', () => {
    const onPress = vi.fn();
    render(<NewQuoteButton isLoading={false} onPress={onPress} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('activates with Enter and Space when idle', () => {
    const onPress = vi.fn();
    render(<NewQuoteButton isLoading={false} onPress={onPress} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyUp(button, { key: ' ' });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('shows "Loading...", stays focusable via aria-disabled, and ignores presses while loading', () => {
    const onPress = vi.fn();
    render(<NewQuoteButton isLoading onPress={onPress} />);
    const button = screen.getByRole('button', { name: /Loading\.\.\./ });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('tabindex', '-1');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });
});
