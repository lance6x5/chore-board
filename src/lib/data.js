// App data model, defaults, and import validation.
import { isDateKey } from './dates.js';

export const SCHEMA_VERSION = 1;
export const APP_ID = 'chore-champs';

export const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐯', '🐨', '🐵', '🐧', '🦖', '🐝', '🚀', '⚽', '🌈', '🎸'];

// Bright kid colors chosen to stay readable with dark text on a light tint.
export const KID_COLORS = ['#E8590C', '#2F9E44', '#1C7ED6', '#AE3EC9', '#E64980', '#0C8599', '#F08C00', '#5F3DC4'];

export const REWARD_ICONS = ['🎮', '📺', '🍕', '🍦', '🎬', '🧸', '🛝', '🌙', '📚', '🎁'];

export function defaultSettings() {
  return {
    pinHash: null,
    pinSalt: null,
    allowanceEnabled: false,
    pointsPerUnit: 10, // 10 points = 1 currency unit
    currencySymbol: '$',
  };
}

export function emptyState() {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    settings: defaultSettings(),
    kids: [],
    chores: [],
    completions: [],
    rewards: [],
    redemptions: [],
    payouts: [],
  };
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const str = (x, fallback = '') => (typeof x === 'string' ? x : fallback);
const num = (x, fallback = 0) => (Number.isFinite(Number(x)) ? Number(x) : fallback);
const arr = (x) => (Array.isArray(x) ? x : []);

const FREQS = ['daily', 'weekdays', 'weekly', 'once'];
const COMPLETION_STATUS = ['pending', 'approved', 'rejected'];
const REDEMPTION_STATUS = ['requested', 'redeemed', 'declined'];

/**
 * Validate and normalise imported data. Returns { ok, state, error }.
 * Unknown fields are dropped; records missing required fields are skipped.
 */
export function validateState(raw) {
  if (!isObj(raw)) return { ok: false, error: 'File is not a Chore Champs backup (expected a JSON object).' };
  if (raw.app && raw.app !== APP_ID) return { ok: false, error: `This backup belongs to a different app (${raw.app}).` };
  if (num(raw.schemaVersion, 1) > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of Chore Champs. Please update the app.' };
  }
  for (const key of ['kids', 'chores', 'completions', 'rewards', 'redemptions']) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) {
      return { ok: false, error: `Invalid backup: "${key}" must be a list.` };
    }
  }

  const s = isObj(raw.settings) ? raw.settings : {};
  const settings = {
    ...defaultSettings(),
    pinHash: typeof s.pinHash === 'string' ? s.pinHash : null,
    pinSalt: typeof s.pinSalt === 'string' ? s.pinSalt : null,
    allowanceEnabled: Boolean(s.allowanceEnabled),
    pointsPerUnit: Math.max(1, num(s.pointsPerUnit, 10)),
    currencySymbol: str(s.currencySymbol, '$').slice(0, 3),
  };
  if (!settings.pinHash || !settings.pinSalt) {
    settings.pinHash = null;
    settings.pinSalt = null;
  }

  const kids = arr(raw.kids)
    .filter((k) => isObj(k) && k.id && k.name)
    .map((k) => ({
      id: String(k.id),
      name: str(k.name).slice(0, 40),
      avatar: str(k.avatar, AVATARS[0]),
      color: /^#[0-9a-fA-F]{6}$/.test(k.color) ? k.color : KID_COLORS[0],
    }));
  const kidIds = new Set(kids.map((k) => k.id));

  const chores = arr(raw.chores)
    .filter((c) => isObj(c) && c.id && c.name && FREQS.includes(c.frequency))
    .map((c) => ({
      id: String(c.id),
      name: str(c.name).slice(0, 80),
      icon: str(c.icon, '⭐'),
      points: Math.max(0, Math.round(num(c.points, 1))),
      kidIds: arr(c.kidIds).map(String).filter((id) => kidIds.has(id)),
      frequency: c.frequency,
      weekdays: arr(c.weekdays).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      date: isDateKey(c.date) ? c.date : null,
      active: c.active !== false,
      createdAt: str(c.createdAt, new Date().toISOString()),
    }));
  const choreIds = new Set(chores.map((c) => c.id));

  const completions = arr(raw.completions)
    .filter(
      (c) =>
        isObj(c) && c.id && kidIds.has(String(c.kidId)) && choreIds.has(String(c.choreId)) &&
        isDateKey(c.date) && COMPLETION_STATUS.includes(c.status),
    )
    .map((c) => ({
      id: String(c.id),
      choreId: String(c.choreId),
      kidId: String(c.kidId),
      date: c.date,
      status: c.status,
      points: Math.max(0, Math.round(num(c.points))),
      bonus: Math.max(0, Math.round(num(c.bonus))),
      createdAt: str(c.createdAt, new Date().toISOString()),
      reviewedAt: typeof c.reviewedAt === 'string' ? c.reviewedAt : null,
    }));

  const rewards = arr(raw.rewards)
    .filter((r) => isObj(r) && r.id && r.name)
    .map((r) => ({
      id: String(r.id),
      name: str(r.name).slice(0, 80),
      icon: str(r.icon, '🎁'),
      cost: Math.max(1, Math.round(num(r.cost, 1))),
    }));

  const redemptions = arr(raw.redemptions)
    .filter((r) => isObj(r) && r.id && kidIds.has(String(r.kidId)) && REDEMPTION_STATUS.includes(r.status))
    .map((r) => ({
      id: String(r.id),
      rewardId: String(r.rewardId ?? ''),
      rewardName: str(r.rewardName, 'Reward'),
      kidId: String(r.kidId),
      cost: Math.max(0, Math.round(num(r.cost))),
      status: r.status,
      createdAt: str(r.createdAt, new Date().toISOString()),
      resolvedAt: typeof r.resolvedAt === 'string' ? r.resolvedAt : null,
    }));

  const payouts = arr(raw.payouts)
    .filter((p) => isObj(p) && p.id && kidIds.has(String(p.kidId)))
    .map((p) => ({
      id: String(p.id),
      kidId: String(p.kidId),
      points: Math.max(0, Math.round(num(p.points))),
      amount: Math.max(0, num(p.amount)),
      createdAt: str(p.createdAt, new Date().toISOString()),
    }));

  return {
    ok: true,
    state: { app: APP_ID, schemaVersion: SCHEMA_VERSION, settings, kids, chores, completions, rewards, redemptions, payouts },
  };
}
