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
});
