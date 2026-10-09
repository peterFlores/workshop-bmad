// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readCss = () => readFileSync(new URL('./index.css', import.meta.url), 'utf8');

function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.[\]="()-]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`rule not found: ${selector}`);
  return match[1];
}

describe('quote fade css', () => {
  it('fades out in 150ms and in in 250ms, transitioning opacity only', () => {
    const css = readCss();
    const base = rule(css, '.quote-fade');
    const out = rule(css, '.quote-fade[data-phase="out"]');
    expect(base).toMatch(/transition:\s*opacity\s+250ms/);
    expect(base).not.toMatch(/transition:[^;]*(transform|all|height|width|margin)/);
    expect(base).toMatch(/opacity:\s*1/);
    expect(out).toMatch(/opacity:\s*0/);
    expect(out).toMatch(/transition:\s*opacity\s+150ms/);
  });

  it('removes the transition under prefers-reduced-motion: reduce', () => {
    const css = readCss();
    const block = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/);
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/\.quote-fade[^{]*\{[^}]*transition:\s*none/);
  });

  it('covers every transition class in the reduced-motion rule', () => {
    const css = readCss();
    const transitioned = [...css.matchAll(/([^{}]+)\{[^}]*transition:\s*opacity/g)].flatMap((m) =>
      m[1].split(',').map((s) => s.trim()).filter((s) => s.startsWith('.')),
    );
    expect(transitioned.length).toBeGreaterThan(0);
    const block = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/)![1];
    for (const sel of transitioned) expect(block).toContain(sel);
    expect(block).toMatch(/transition:\s*none/);
  });
});

describe('responsive layout', () => {
  it('uses 24px card padding by default and 40px from 640px', () => {
    const css = readCss();
    expect(rule(css, '.dark,\n[data-theme="dark"]').replace(/\s+/g, ' ')).toMatch(/--card-padding:\s*24px/);
    const media = css.match(/@media\s*\(min-width:\s*640px\)\s*\{([\s\S]*?\})\s*\}/);
    expect(media).not.toBeNull();
    expect(media![1]).toMatch(/--card-padding:\s*40px/);
  });

  it('caps the card column at 640px with 16px mobile margins', () => {
    const page = readFileSync(new URL('./pages/quote-page.tsx', import.meta.url), 'utf8');
    expect(page).toMatch(/max-w-\[640px\]/);
    expect(page).toMatch(/px-4/);
  });

  it('makes the button full width and at least 44px high on phones', () => {
    const button = readFileSync(new URL('./components/new-quote-button.tsx', import.meta.url), 'utf8');
    expect(button).toMatch(/min-h-\[44px\]/);
    expect(button).toMatch(/\bw-full\b/);
  });
});
