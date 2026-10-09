import { useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryEntry } from '../domain/history-entry.ts';

export type HistoryStatus = 'loading' | 'ready' | 'error';

export function useHistory(): { history: HistoryEntry[]; status: HistoryStatus; refresh: () => void } {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<HistoryStatus>('loading');
  const latest = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    const requestId = ++latest.current;
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    (async () => {
      try {
        const res = await fetch('/api/history', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as HistoryEntry[];
        if (requestId !== latest.current) return;
        setHistory(data);
        setStatus('ready');
      } catch (error) {
        if (requestId !== latest.current) return;
        console.error('Failed to load history', error);
        setStatus('error');
      }
    })();
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      latest.current++;
      controller.current?.abort();
    };
  }, [refresh]);

  return { history, status, refresh };
}
