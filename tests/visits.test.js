import { describe, it, expect, vi } from 'vitest';
import { getVisitCount, formatVisits, isLocalHost, prefersNoTracking, SESSION_FLAG } from '../src/lib/visits.js';

const HIT = 'https://abacus.jasoncameron.dev/hit/lance6x5.github.io/chore-board';
const GET = 'https://abacus.jasoncameron.dev/get/lance6x5.github.io/chore-board';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
}

function okFetch(value) {
  return vi.fn(async () => ({ ok: true, json: async () => ({ value }) }));
}

const env = (over = {}) => ({
  hostname: 'lance6x5.github.io',
  navigator: { doNotTrack: null, globalPrivacyControl: false, onLine: true },
  sessionStorage: memoryStorage(),
  ...over,
});

describe('visits', () => {
  it('hits on the first load of a session, then only gets', async () => {
    const e = env({ fetch: okFetch(42) });
    expect(await getVisitCount(e)).toBe(42);
    expect(e.fetch.mock.calls[0][0]).toBe(HIT);
    expect(e.sessionStorage.getItem(SESSION_FLAG)).toBe('1');

    expect(await getVisitCount(e)).toBe(42);
    expect(e.fetch.mock.calls[1][0]).toBe(GET);
  });

  it('sends no data: no query, no credentials, no custom headers', async () => {
    const e = env({ fetch: okFetch(1) });
    await getVisitCount(e);
    const [url, opts] = e.fetch.mock.calls[0];
    expect(url).not.toContain('?');
    expect(opts.credentials).toBe('omit');
    expect(opts.cache).toBe('no-store');
    expect(opts.headers).toBeUndefined();
    expect(opts.body).toBeUndefined();
  });

  it('returns null on failure and does not set the session flag', async () => {
    const e = env({ fetch: vi.fn(async () => ({ ok: false, json: async () => ({}) })) });
    expect(await getVisitCount(e)).toBeNull();
    expect(e.sessionStorage.getItem(SESSION_FLAG)).toBeNull();

    const boom = env({ fetch: vi.fn(async () => { throw new Error('offline'); }) });
    expect(await getVisitCount(boom)).toBeNull();

    const bad = env({ fetch: vi.fn(async () => ({ ok: true, json: async () => ({ error: 'x' }) })) });
    expect(await getVisitCount(bad)).toBeNull();
  });

  it('skips /hit with Do Not Track, Global Privacy Control, or on localhost', async () => {
    for (const e of [
      env({ fetch: okFetch(7), navigator: { doNotTrack: '1' } }),
      env({ fetch: okFetch(7), navigator: { globalPrivacyControl: true } }),
      env({ fetch: okFetch(7), hostname: 'localhost' }),
      env({ fetch: okFetch(7), hostname: '127.0.0.1' }),
    ]) {
      expect(await getVisitCount(e)).toBe(7);
      expect(e.fetch.mock.calls[0][0]).toBe(GET);
    }
  });

  it('survives blocked storage', async () => {
    const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const e = env({ fetch: okFetch(3), sessionStorage: blocked });
    expect(await getVisitCount(e)).toBe(3);
  });

  it('helpers', () => {
    expect(formatVisits(12345, 'en-US')).toBe('12,345');
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('lance6x5.github.io')).toBe(false);
    expect(prefersNoTracking({ doNotTrack: '1' })).toBe(true);
    expect(prefersNoTracking({ doNotTrack: '0' })).toBe(false);
  });
});
