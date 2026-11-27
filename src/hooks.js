// React hooks: persistent store, hash router, and "today" clock.
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadState, saveState, clearState } from './lib/db.js';
import { emptyState, validateState } from './lib/data.js';
import { todayKey } from './lib/dates.js';

/**
 * App store backed by IndexedDB. `update(fn)` applies a pure transition
 * (state => state) and persists the result.
 */
export function useStore() {
  const [state, setState] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadState().then((raw) => {
      if (cancelled) return;
      const result = raw ? validateState(raw) : null;
      const initial = result?.ok ? result.state : emptyState();
      ref.current = initial;
      setState(initial);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next) => {
    ref.current = next;
    setState(next);
    saveState(next).then((ok) => setSaveFailed(!ok));
  }, []);

  const update = useCallback(
    (fn) => {
      const prev = ref.current;
      const next = fn(prev);
      if (next && next !== prev) commit(next);
      return next;
    },
    [commit],
  );

  const replace = useCallback((next) => commit(next), [commit]);

  const reset = useCallback(async () => {
    await clearState();
    commit(emptyState());
  }, [commit]);

  return { state, update, replace, reset, saveFailed };
}

function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, '');
  return h.split('/').filter(Boolean).map(decodeURIComponent);
}

/** Current hash route as path segments, e.g. "#/kid/abc" -> ["kid", "abc"]. */
export function useHashRoute() {
  const [parts, setParts] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setParts(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parts;
}

export function href(path) {
  return `#/${path.replace(/^\//, '')}`;
}

export function navigate(path) {
  window.location.hash = href(path);
}

/** Today's date key, refreshed every minute so the board rolls over at midnight. */
export function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return today;
}
