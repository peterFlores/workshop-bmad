// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { darkTokens } from './theme-tokens.ts';

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('dark theme contrast (WCAG AA)', () => {
  const t = darkTokens;
  it.each([
    ['foreground/surface', t.foreground, t.surface],
    ['muted/surface', t.muted, t.surface],
    ['accent-foreground/accent', t['accent-foreground'], t.accent],
    ['danger/surface', t.danger, t.surface],
  ])('%s is at least 4.5:1', (_n, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('index.css declares the same token values', () => {
    const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8').toLowerCase();
    const map: Record<string, string> = { 'surface-border': 'border' };
    for (const [name, hex] of Object.entries(t)) {
      expect(css).toContain(`--${map[name] ?? name}: ${hex.toLowerCase()}`);
    }
  });

  it('quote and author rules declare no text-transform', () => {
    const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');
    for (const sel of ['.quote-text', '.quote-author']) {
      const block = css.match(new RegExp(`${sel.replace('.', '\\.')}\\s*\\{([^}]*)\\}`));
      expect(block, sel).not.toBeNull();
      expect(block![1]).not.toMatch(/text-transform/);
    }
  });
});
