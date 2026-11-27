// Anonymous visit counter using the open-source Abacus service
// (https://github.com/JasonLovesDoggo/abacus). No signup, no key, no cookies.
// One /hit per browser session, /get otherwise. Sends no app or user data:
// no query params, no extra headers, no credentials. Fails silently.

export const COUNTER_BASE = 'https://abacus.jasoncameron.dev';
export const COUNTER_KEY = 'lance6x5.github.io/chore-board';
export const SESSION_FLAG = 'chore-board:visit-counted';
const TIMEOUT_MS = 4000;

function safeStorage(env) {
  try {
    return env.sessionStorage || null;
  } catch {
    return null;
  }
}

function getFlag(storage) {
  try {
    return storage ? storage.getItem(SESSION_FLAG) === '1' : false;
  } catch {
    return false;
  }
}

function setFlag(storage) {
  try {
    if (storage) storage.setItem(SESSION_FLAG, '1');
  } catch {
    // Storage blocked or full: ignore.
  }
}

/** True when the visitor asked not to be tracked (DNT or Global Privacy Control). */
export function prefersNoTracking(nav) {
  if (!nav) return false;
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

/** True on local dev hosts, where visits should not be counted. */
export function isLocalHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1' || h.endsWith('.localhost');
}

/** Format a count like "12,345". */
export function formatVisits(n, locale) {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

async function request(fetchFn, url) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    const res = await fetchFn(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    const value = Number(data && data.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Count this visit (once per browser session) and return the total, or null on any failure.
 * On localhost or with DNT / GPC the visit is not counted; the current total is only read.
 * @param {{ fetch?: Function, sessionStorage?: Storage, navigator?: Navigator, hostname?: string }} [env]
 * @returns {Promise<number|null>}
 */
export async function getVisitCount(env = {}) {
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    const fetchFn = env.fetch || (typeof g.fetch === 'function' ? g.fetch.bind(g) : null);
    if (!fetchFn) return null;
    const nav = 'navigator' in env ? env.navigator : g.navigator;
    if (nav && nav.onLine === false) return null;
    const hostname = 'hostname' in env ? env.hostname : g.location && g.location.hostname;
    const storage = 'sessionStorage' in env ? env.sessionStorage : safeStorage(g);

    const skipHit = isLocalHost(hostname) || prefersNoTracking(nav);
    const shouldHit = !skipHit && !getFlag(storage);
    const url = `${COUNTER_BASE}/${shouldHit ? 'hit' : 'get'}/${COUNTER_KEY}`;
    const value = await request(fetchFn, url);
    if (shouldHit && value !== null) setFlag(storage);
    return value;
  } catch {
    return null;
  }
}
