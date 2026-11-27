// Chore scheduling: which chores show up for a kid on a given day, and
// what their completion status is for the current period.
import { dayOfWeek, weekStart } from './dates.js';

export const FREQUENCIES = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Specific weekdays' },
  { value: 'weekly', label: 'Once a week' },
  { value: 'once', label: 'One time' },
];

/** Is the chore scheduled to appear on `dateKey` (ignoring completions)? */
export function isScheduledOn(chore, dateKey) {
  if (!chore || chore.active === false) return false;
  switch (chore.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return Array.isArray(chore.weekdays) && chore.weekdays.includes(dayOfWeek(dateKey));
    case 'weekly':
      // A weekly chore can be done on any day of the week, once.
      return true;
    case 'once':
      return !chore.date || dateKey >= chore.date;
    default:
      return false;
  }
}

/**
 * The "period" a completion counts toward. Daily / weekday chores reset
 * each day, weekly chores each Monday, and one-time chores never reset.
 */
export function periodKey(chore, dateKey) {
  switch (chore.frequency) {
    case 'weekly':
      return `w:${weekStart(dateKey)}`;
    case 'once':
      return 'once';
    default:
      return `d:${dateKey}`;
  }
}

const STATUS_RANK = { approved: 3, pending: 2, rejected: 1 };

/**
 * Best completion record for chore+kid in the period containing dateKey.
 * Approved beats pending beats rejected; later beats earlier on ties.
 */
export function completionFor(state, chore, kidId, dateKey) {
  const period = periodKey(chore, dateKey);
  let best = null;
  for (const c of state.completions) {
    if (c.choreId !== chore.id || c.kidId !== kidId) continue;
    if (c.date > dateKey) continue;
    if (periodKey(chore, c.date) !== period) continue;
    if (
      !best ||
      STATUS_RANK[c.status] > STATUS_RANK[best.status] ||
      (STATUS_RANK[c.status] === STATUS_RANK[best.status] && c.createdAt > best.createdAt)
    ) {
      best = c;
    }
  }
  return best;
}

/**
 * Chores to show on a kid's board for `dateKey`, each paired with its
 * status: 'todo' | 'pending' | 'approved' | 'rejected'.
 * Weekly / one-time chores that were approved on an earlier day are hidden.
 */
export function choresForKid(state, kidId, dateKey) {
  const out = [];
  for (const chore of state.chores) {
    if (!chore.kidIds?.includes(kidId)) continue;
    if (!isScheduledOn(chore, dateKey)) continue;
    const completion = completionFor(state, chore, kidId, dateKey);
    if (completion?.status === 'approved' && completion.date < dateKey) continue;
    out.push({ chore, completion, status: completion ? completion.status : 'todo' });
  }
  return out;
}

/** Can the kid tap "done" on this chore right now? */
export function canMarkDone(state, chore, kidId, dateKey) {
  if (!isScheduledOn(chore, dateKey)) return false;
  const c = completionFor(state, chore, kidId, dateKey);
  return !c || c.status === 'rejected';
}

/** Human readable description of a chore's frequency. */
export function describeFrequency(chore, weekdayNames) {
  switch (chore.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return (chore.weekdays || [])
        .slice()
        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
        .map((d) => weekdayNames[d])
        .join(', ') || 'No days picked';
    case 'weekly':
      return 'Once a week';
    case 'once':
      return chore.date ? `One time (from ${chore.date})` : 'One time';
    default:
      return chore.frequency;
  }
}
