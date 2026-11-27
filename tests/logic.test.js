import { describe, it, expect } from 'vitest';
import { addDays, weekStart, weekDays, toKey, fromKey } from '../src/lib/dates.js';
import { choresForKid, canMarkDone, isScheduledOn } from '../src/lib/schedule.js';
import { balance, currentStreak, bestStreak, weeklySummary, pointsToMoney } from '../src/lib/points.js';
import { emptyState, validateState } from '../src/lib/data.js';
import * as A from '../src/lib/actions.js';
import { hashPin, createPinRecord, verifyPin, isValidPin } from '../src/lib/pin.js';
import { buildIssueUrl, trimUserAgent } from '../src/lib/feedback.js';

// 2026-11-23 is a Monday.
const MON = '2026-11-23';

function setup() {
  let s = emptyState();
  s = A.addKid(s, { name: 'Ava', avatar: '🦊', color: '#E8590C' });
  const kid = s.kids[0];
  s = A.saveChore(s, { name: 'Bed', points: 5, kidIds: [kid.id], frequency: 'daily' });
  s = A.saveChore(s, { name: 'Trash', points: 10, kidIds: [kid.id], frequency: 'weekdays', weekdays: [1, 3] });
  s = A.saveChore(s, { name: 'Car', points: 20, kidIds: [kid.id], frequency: 'weekly' });
  s = A.saveChore(s, { name: 'Garage', points: 30, kidIds: [kid.id], frequency: 'once', date: MON });
  return { s, kid };
}

describe('dates', () => {
  it('computes week start (Monday) and days', () => {
    expect(weekStart('2026-11-29')).toBe(MON); // Sunday -> previous Monday
    expect(weekDays(MON)).toHaveLength(7);
    expect(addDays(MON, 7)).toBe('2026-11-30');
    expect(toKey(fromKey(MON))).toBe(MON);
  });
});

describe('schedule', () => {
  it('shows the right chores per day', () => {
    const { s, kid } = setup();
    const names = (d) => choresForKid(s, kid.id, d).map((i) => i.chore.name).sort();
    expect(names(MON)).toEqual(['Bed', 'Car', 'Garage', 'Trash']);
    expect(names('2026-11-24')).toEqual(['Bed', 'Car', 'Garage']); // Tuesday
    expect(isScheduledOn(s.chores[3], '2026-11-22')).toBe(false); // before one-time date
  });

  it('pending blocks re-marking, rejected allows retry, weekly hides after approval', () => {
    let { s, kid } = setup();
    const car = s.chores.find((c) => c.name === 'Car');
    s = A.markDone(s, car.id, kid.id, MON);
    expect(canMarkDone(s, car, kid.id, MON)).toBe(false);
    const c1 = s.completions[0];
    s = A.reviewCompletion(s, c1.id, false);
    expect(canMarkDone(s, car, kid.id, MON)).toBe(true);
    s = A.markDone(s, car.id, kid.id, MON);
    s = A.reviewCompletion(s, s.completions[1].id, true, 3);
    expect(choresForKid(s, kid.id, MON).find((i) => i.chore.id === car.id).status).toBe('approved');
    expect(choresForKid(s, kid.id, '2026-11-24').some((i) => i.chore.id === car.id)).toBe(false);
    expect(choresForKid(s, kid.id, '2026-11-30').some((i) => i.chore.id === car.id)).toBe(true); // new week
    expect(balance(s, kid.id)).toBe(23);
  });
});

describe('points, streaks, rewards', () => {
  it('tracks streaks and summaries', () => {
    let { s, kid } = setup();
    const bed = s.chores[0];
    for (const d of [MON, '2026-11-24', '2026-11-25', '2026-11-27']) {
      s = A.markDone(s, bed.id, kid.id, d);
      s = A.reviewCompletion(s, s.completions.at(-1).id, true);
    }
    expect(currentStreak(s, kid.id, '2026-11-27')).toBe(1);
    expect(currentStreak(s, kid.id, '2026-11-26')).toBe(3); // yesterday counts
    expect(bestStreak(s, kid.id)).toBe(3);
    const sum = weeklySummary(s, kid.id, MON);
    expect(sum.choresApproved).toBe(4);
    expect(sum.pointsEarned).toBe(20);
    expect(sum.activeDays).toBe(4);
  });

  it('redeems rewards and pays out allowance', () => {
    let { s, kid } = setup();
    s = A.markDone(s, s.chores[3].id, kid.id, MON);
    s = A.reviewCompletion(s, s.completions[0].id, true); // 30 pts
    s = A.saveReward(s, { name: 'Screen time', cost: 20 });
    const reward = s.rewards[0];
    let r = A.requestReward(s, reward.id, kid.id);
    expect(r.error).toBeNull();
    s = r.state;
    r = A.requestReward(s, reward.id, kid.id); // only 10 left unreserved
    expect(r.error).toBeTruthy();
    s = A.resolveRedemption(s, s.redemptions[0].id, true).state;
    expect(balance(s, kid.id)).toBe(10);
    s = A.updateSettings(s, { allowanceEnabled: true, pointsPerUnit: 10 });
    expect(pointsToMoney(10, s.settings)).toBe(1);
    expect(A.payOut(s, kid.id, 50).error).toBeTruthy();
    s = A.payOut(s, kid.id, 10).state;
    expect(balance(s, kid.id)).toBe(0);
  });
});

describe('data validation', () => {
  it('round-trips and rejects junk', () => {
    const { s } = setup();
    const res = validateState(JSON.parse(JSON.stringify(s)));
    expect(res.ok).toBe(true);
    expect(res.state.chores).toHaveLength(4);
    expect(validateState([]).ok).toBe(false);
    expect(validateState({ app: 'other' }).ok).toBe(false);
    expect(validateState({ kids: 'nope' }).ok).toBe(false);
  });
});

describe('pin', () => {
  it('stores only a salted hash', async () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12a4')).toBe(false);
    const rec = await createPinRecord('2468');
    expect(JSON.stringify(rec)).not.toContain('2468');
    expect(await verifyPin('2468', rec)).toBe(true);
    expect(await verifyPin('1111', rec)).toBe(false);
    expect(await hashPin('2468', 'a')).not.toBe(await hashPin('2468', 'b'));
  });
});

describe('feedback URLs', () => {
  it('builds pre-filled issue URLs', () => {
    const bug = new URL(buildIssueUrl('bug', { version: '1.0.0', userAgent: 'Mozilla/5.0 Test' }));
    expect(bug.origin + bug.pathname).toBe('https://github.com/lance6x5/chore-board/issues/new');
    expect(bug.searchParams.get('template')).toBe('bug_report.yml');
    expect(bug.searchParams.get('title')).toBe('[Bug]: ');
    expect(bug.searchParams.get('version')).toBe('1.0.0');
    expect(bug.searchParams.get('environment')).toBe('Mozilla/5.0 Test');
    const feat = new URL(buildIssueUrl('feature', { version: '1.0.0', userAgent: 'x' }));
    expect(feat.searchParams.get('template')).toBe('feature_request.yml');
    expect(feat.searchParams.has('environment')).toBe(false);
    expect(trimUserAgent('a'.repeat(500)).length).toBe(120);
    expect(() => buildIssueUrl('nope')).toThrow();
  });
});
