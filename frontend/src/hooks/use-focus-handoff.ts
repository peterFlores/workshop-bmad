import { useCallback, useEffect, useRef } from 'react';
import type { ToggleResult } from './use-favorites.ts';

// After a toggle removes the row that holds focus, move focus to the next row's
// heart, or to the section heading when there is no next row.
export function useFocusHandoff<T>(items: T[]) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const target = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (target.current === undefined) return;
    const key = target.current;
    target.current = undefined;
    const next = key === null ? null : listRef.current?.querySelector<HTMLElement>(`[data-row-key="${key}"] button`);
    (next ?? headingRef.current)?.focus();
  }, [items]);

  const run = useCallback(
    async (rowKey: string, nextKey: string | null, toggle: () => Promise<ToggleResult>) => {
      const row = listRef.current?.querySelector(`[data-row-key="${rowKey}"]`);
      const hadFocus = !!row && row.contains(document.activeElement);
      if (hadFocus) target.current = nextKey;
      const result = await toggle();
      if (result !== 'removed') target.current = undefined;
      return result;
    },
    [],
  );

  return { headingRef, listRef, run };
}
