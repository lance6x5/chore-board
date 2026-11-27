// Pure state transitions. Each takes the current state and returns a new one.
import { uid } from './ids.js';
import { canMarkDone } from './schedule.js';
import { balance, pointsToMoney } from './points.js';

const now = () => new Date().toISOString();

// ---------- Kids ----------
export function addKid(state, { name, avatar, color }) {
  const kid = { id: uid(), name: name.trim(), avatar, color };
  return { ...state, kids: [...state.kids, kid] };
}

export function updateKid(state, id, patch) {
  return { ...state, kids: state.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) };
}

/** Removing a kid also removes their history and unassigns their chores. */
export function removeKid(state, id) {
  return {
    ...state,
    kids: state.kids.filter((k) => k.id !== id),
    chores: state.chores.map((c) => ({ ...c, kidIds: c.kidIds.filter((k) => k !== id) })),
    completions: state.completions.filter((c) => c.kidId !== id),
    redemptions: state.redemptions.filter((r) => r.kidId !== id),
    payouts: state.payouts.filter((p) => p.kidId !== id),
  };
}

// ---------- Chores ----------
export function saveChore(state, chore) {
  const clean = {
    icon: '⭐',
    weekdays: [],
    date: null,
    active: true,
    ...chore,
    name: chore.name.trim(),
    points: Math.max(0, Math.round(Number(chore.points) || 0)),
  };
  if (clean.id && state.chores.some((c) => c.id === clean.id)) {
    return { ...state, chores: state.chores.map((c) => (c.id === clean.id ? { ...c, ...clean } : c)) };
  }
  return { ...state, chores: [...state.chores, { ...clean, id: uid(), createdAt: now() }] };
}

export function removeChore(state, id) {
  return {
    ...state,
    chores: state.chores.filter((c) => c.id !== id),
    // Keep approved history (points already earned); drop open items.
    completions: state.completions.filter((c) => c.choreId !== id || c.status === 'approved'),
  };
}

// ---------- Completions ----------
export function markDone(state, choreId, kidId, dateKey) {
  const chore = state.chores.find((c) => c.id === choreId);
  if (!chore || !canMarkDone(state, chore, kidId, dateKey)) return state;
  const completion = {
    id: uid(),
    choreId,
    kidId,
    date: dateKey,
    status: 'pending',
    points: chore.points, // snapshot so later edits don't rewrite history
    bonus: 0,
    createdAt: now(),
    reviewedAt: null,
  };
  return { ...state, completions: [...state.completions, completion] };
}

/** Kid changed their mind before a parent reviewed it. */
export function undoDone(state, completionId) {
  return {
    ...state,
    completions: state.completions.filter((c) => !(c.id === completionId && c.status === 'pending')),
  };
}

export function reviewCompletion(state, completionId, approve, bonus = 0) {
  return {
    ...state,
    completions: state.completions.map((c) =>
      c.id === completionId
        ? {
            ...c,
            status: approve ? 'approved' : 'rejected',
            bonus: approve ? Math.max(0, Math.round(Number(bonus) || 0)) : 0,
            reviewedAt: now(),
          }
        : c,
    ),
  };
}

// ---------- Rewards ----------
export function saveReward(state, reward) {
  const clean = { icon: '🎁', ...reward, name: reward.name.trim(), cost: Math.max(1, Math.round(Number(reward.cost) || 1)) };
  if (clean.id && state.rewards.some((r) => r.id === clean.id)) {
    return { ...state, rewards: state.rewards.map((r) => (r.id === clean.id ? { ...r, ...clean } : r)) };
  }
  return { ...state, rewards: [...state.rewards, { ...clean, id: uid() }] };
}

export function removeReward(state, id) {
  return {
    ...state,
    rewards: state.rewards.filter((r) => r.id !== id),
    redemptions: state.redemptions.filter((r) => r.rewardId !== id || r.status !== 'requested'),
  };
}

/** Points tied up in open reward requests. */
export function requestedPoints(state, kidId) {
  return state.redemptions
    .filter((r) => r.kidId === kidId && r.status === 'requested')
    .reduce((t, r) => t + r.cost, 0);
}

/**
 * Kid asks for a reward. If `redeemNow` (parent entered PIN) it is
 * redeemed immediately, otherwise it waits in the parent's queue.
 * Returns { state, error }.
 */
export function requestReward(state, rewardId, kidId, redeemNow = false) {
  const reward = state.rewards.find((r) => r.id === rewardId);
  if (!reward) return { state, error: 'That reward no longer exists.' };
  const available = balance(state, kidId) - requestedPoints(state, kidId);
  if (available < reward.cost) return { state, error: 'Not enough points yet. Keep going!' };
  const ts = now();
  const redemption = {
    id: uid(),
    rewardId,
    rewardName: reward.name,
    kidId,
    cost: reward.cost,
    status: redeemNow ? 'redeemed' : 'requested',
    createdAt: ts,
    resolvedAt: redeemNow ? ts : null,
  };
  return { state: { ...state, redemptions: [...state.redemptions, redemption] }, error: null };
}

export function resolveRedemption(state, redemptionId, approve) {
  const r = state.redemptions.find((x) => x.id === redemptionId);
  if (!r || r.status !== 'requested') return { state, error: null };
  if (approve) {
    // Other open requests still count as reserved; this one is being spent.
    const available = balance(state, r.kidId) - (requestedPoints(state, r.kidId) - r.cost);
    if (available < r.cost) return { state, error: 'Not enough points for this reward.' };
  }
  return {
    state: {
      ...state,
      redemptions: state.redemptions.map((x) =>
        x.id === redemptionId ? { ...x, status: approve ? 'redeemed' : 'declined', resolvedAt: now() } : x,
      ),
    },
    error: null,
  };
}

// ---------- Allowance ----------
/** Convert points to cash paid out by the parent. Returns { state, error }. */
export function payOut(state, kidId, points) {
  const p = Math.round(Number(points) || 0);
  if (p <= 0) return { state, error: 'Enter a number of points to pay out.' };
  if (p > balance(state, kidId)) return { state, error: 'That is more than the available balance.' };
  const payout = { id: uid(), kidId, points: p, amount: pointsToMoney(p, state.settings), createdAt: now() };
  return { state: { ...state, payouts: [...state.payouts, payout] }, error: null };
}

// ---------- Settings ----------
export function updateSettings(state, patch) {
  return { ...state, settings: { ...state.settings, ...patch } };
}
