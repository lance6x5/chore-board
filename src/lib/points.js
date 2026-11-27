// Points, balances, streaks and weekly summaries (pure functions).
import { addDays, isoToKey, weekDays } from './dates.js';

const sum = (arr, fn) => arr.reduce((t, x) => t + (Number(fn(x)) || 0), 0);

export function earnedPoints(state, kidId) {
  return sum(
    state.completions.filter((c) => c.kidId === kidId && c.status === 'approved'),
    (c) => (c.points || 0) + (c.bonus || 0),
  );
}

export function spentPoints(state, kidId) {
  return sum(
    state.redemptions.filter((r) => r.kidId === kidId && r.status === 'redeemed'),
    (r) => r.cost,
  );
}

export function paidOutPoints(state, kidId) {
  return sum(
    state.payouts.filter((p) => p.kidId === kidId),
    (p) => p.points,
  );
}

/** Points available to spend. */
export function balance(state, kidId) {
  return earnedPoints(state, kidId) - spentPoints(state, kidId) - paidOutPoints(state, kidId);
}

/** Points currently waiting for parent approval. */
export function pendingPoints(state, kidId) {
  return sum(
    state.completions.filter((c) => c.kidId === kidId && c.status === 'pending'),
    (c) => c.points,
  );
}

/** Convert points to money using settings.pointsPerUnit (e.g. 10 pts = $1). */
export function pointsToMoney(points, settings) {
  const per = Number(settings?.pointsPerUnit) || 0;
  if (per <= 0) return 0;
  return Math.floor((points / per) * 100) / 100;
}

export function formatMoney(amount, settings) {
  const symbol = settings?.currencySymbol ?? '$';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

/** Set of day keys on which the kid had at least one approved chore. */
function approvedDays(state, kidId) {
  return new Set(
    state.completions.filter((c) => c.kidId === kidId && c.status === 'approved').map((c) => c.date),
  );
}

/**
 * Current streak: consecutive days with at least one approved chore,
 * ending today (or yesterday, so the streak is not "lost" before today's
 * chores are done).
 */
export function currentStreak(state, kidId, today) {
  const days = approvedDays(state, kidId);
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

/** Longest streak ever. */
export function bestStreak(state, kidId) {
  const days = [...approvedDays(state, kidId)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Weekly summary (Mon..Sun week containing dateKey) for one kid. */
export function weeklySummary(state, kidId, dateKey) {
  const days = weekDays(dateKey);
  const first = days[0];
  const last = days[6];
  const inWeek = (k) => k >= first && k <= last;
  const mine = state.completions.filter((c) => c.kidId === kidId && inWeek(c.date));
  const perDay = days.map((date) => {
    const approvedToday = mine.filter((c) => c.date === date && c.status === 'approved');
    return {
      date,
      count: approvedToday.length,
      points: sum(approvedToday, (c) => (c.points || 0) + (c.bonus || 0)),
    };
  });
  const approved = mine.filter((c) => c.status === 'approved');
  const redeemed = state.redemptions.filter(
    (r) => r.kidId === kidId && r.status === 'redeemed' && r.resolvedAt && inWeek(isoToKey(r.resolvedAt)),
  );
  return {
    weekStart: first,
    weekEnd: last,
    perDay,
    choresApproved: approved.length,
    choresPending: mine.filter((c) => c.status === 'pending').length,
    choresRejected: mine.filter((c) => c.status === 'rejected').length,
    pointsEarned: sum(approved, (c) => c.points),
    bonusPoints: sum(approved, (c) => c.bonus),
    rewardsRedeemed: redeemed.length,
    pointsSpent: sum(redeemed, (r) => r.cost),
    activeDays: perDay.filter((d) => d.count > 0).length,
  };
}
