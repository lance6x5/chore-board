// Date helpers. All dates are stored as local "YYYY-MM-DD" keys so that
// a "day" always means the family's local calendar day.

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n) => String(n).padStart(2, '0');

/** Convert a Date to a local YYYY-MM-DD key. */
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function fromKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function isDateKey(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Day of week (0 = Sunday) for a key. */
export function dayOfWeek(key) {
  return fromKey(key).getDay();
}

/** Monday that starts the week containing `key`. */
export function weekStart(key) {
  const d = fromKey(key);
  const offset = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - offset);
  return toKey(d);
}

/** The 7 day keys (Mon..Sun) of the week containing `key`. */
export function weekDays(key) {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Convert an ISO timestamp to a local day key. */
export function isoToKey(iso) {
  return toKey(new Date(iso));
}

export function formatDay(key, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return fromKey(key).toLocaleDateString(undefined, opts);
}
