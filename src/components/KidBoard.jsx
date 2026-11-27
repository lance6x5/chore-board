import { useState } from 'react';
import Avatar from './Avatar.jsx';
import WeekStrip from './WeekStrip.jsx';
import PinDialog from './PinDialog.jsx';
import { href } from '../hooks.js';
import { choresForKid } from '../lib/schedule.js';
import { balance, currentStreak, formatMoney, pendingPoints, pointsToMoney, weeklySummary } from '../lib/points.js';
import { markDone, requestReward, requestedPoints, undoDone } from '../lib/actions.js';
import { formatDay } from '../lib/dates.js';

const STATUS_TEXT = {
  todo: 'Tap when done!',
  pending: 'Waiting for a grown-up',
  approved: 'Approved!',
  rejected: 'Not yet - try again',
};

const STATUS_ICON = { todo: '👆', pending: '⏳', approved: '✅', rejected: '🔁' };

/** A kid's board: today's chores as big cards, points, streak and rewards. */
export default function KidBoard({ state, update, today, notify, celebrate, kid }) {
  const [pinFor, setPinFor] = useState(null); // reward id awaiting parent PIN
  const items = choresForKid(state, kid.id, today);
  const pts = balance(state, kid.id);
  const reserved = requestedPoints(state, kid.id);
  const available = pts - reserved;
  const waiting = pendingPoints(state, kid.id);
  const streak = currentStreak(state, kid.id, today);
  const summary = weeklySummary(state, kid.id, today);
  const { settings } = state;
  const allDone = items.length > 0 && items.every((i) => i.status === 'approved' || i.status === 'pending');

  function tap(item) {
    if (item.status === 'todo' || item.status === 'rejected') {
      update((s) => markDone(s, item.chore.id, kid.id, today));
      notify(`Nice! "${item.chore.name}" is waiting for approval.`);
    }
  }

  function ask(reward) {
    let error = null;
    update((s) => {
      const r = requestReward(s, reward.id, kid.id, false);
      error = r.error;
      return r.state;
    });
    notify(error || `Asked for "${reward.name}". A grown-up will check soon!`);
  }

  function redeemWithPin() {
    const reward = state.rewards.find((r) => r.id === pinFor);
    setPinFor(null);
    if (!reward) return;
    let error = null;
    update((s) => {
      const r = requestReward(s, reward.id, kid.id, true);
      error = r.error;
      return r.state;
    });
    if (error) notify(error);
    else celebrate(`${kid.name} redeemed "${reward.name}"!`);
  }

  return (
    <div className="kid-board" style={{ '--kid': kid.color }}>
      <section className="kid-hero" aria-labelledby="kid-name">
        <Avatar kid={kid} size="xl" />
        <div className="kid-hero-text">
          <h1 id="kid-name">{kid.name}</h1>
          <p className="muted">{formatDay(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <dl className="stat-row">
          <div className="stat">
            <dt>Points</dt>
            <dd>
              <span aria-hidden="true">⭐</span> {pts}
            </dd>
          </div>
          {waiting > 0 && (
            <div className="stat">
              <dt>Waiting</dt>
              <dd>
                <span aria-hidden="true">⏳</span> {waiting}
              </dd>
            </div>
          )}
          <div className="stat">
            <dt>Streak</dt>
            <dd>
              <span aria-hidden="true">🔥</span> {streak}
            </dd>
          </div>
          {settings.allowanceEnabled && (
            <div className="stat">
              <dt>Allowance</dt>
              <dd>{formatMoney(pointsToMoney(pts, settings), settings)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section aria-labelledby="today-title">
        <h2 id="today-title">Today's chores</h2>
        {items.length === 0 ? (
          <p className="card empty">No chores today. Enjoy your free time! 🎉</p>
        ) : (
          <>
            {allDone && (
              <p className="card success-note" role="status">
                <span aria-hidden="true">🏆</span> All chores done today. You're a champ!
              </p>
            )}
            <ul className="chore-grid">
              {items.map((item) => (
                <li key={item.chore.id}>
                  <button
                    type="button"
                    className={`chore-card status-${item.status}`}
                    onClick={() => tap(item)}
                    aria-disabled={item.status === 'pending' || item.status === 'approved'}
                    aria-label={`${item.chore.name}, ${item.chore.points} points. ${STATUS_TEXT[item.status]}`}
                  >
                    <span className="chore-icon" aria-hidden="true">
                      {item.chore.icon || '⭐'}
                    </span>
                    <span className="chore-name">{item.chore.name}</span>
                    <span className="chore-points">+{item.chore.points}</span>
                    <span className="chore-status">
                      <span aria-hidden="true">{STATUS_ICON[item.status]}</span> {STATUS_TEXT[item.status]}
                    </span>
                  </button>
                  {item.status === 'pending' && (
                    <button
                      type="button"
                      className="btn ghost small undo"
                      onClick={() => update((s) => undoDone(s, item.completion.id))}
                    >
                      Oops, undo
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="rewards-title">
        <h2 id="rewards-title">Rewards</h2>
        {state.rewards.length === 0 ? (
          <p className="card empty">No rewards yet. Ask a grown-up to add some!</p>
        ) : (
          <ul className="reward-grid">
            {state.rewards.map((reward) => {
              const requested = state.redemptions.some(
                (r) => r.kidId === kid.id && r.rewardId === reward.id && r.status === 'requested',
              );
              const canAfford = available >= reward.cost;
              const pct = Math.min(100, Math.round((Math.max(0, available) / reward.cost) * 100));
              return (
                <li key={reward.id} className="reward-card card">
                  <span className="reward-icon" aria-hidden="true">
                    {reward.icon || '🎁'}
                  </span>
                  <span className="reward-name">{reward.name}</span>
                  <span className="reward-cost">{reward.cost} pts</span>
                  <span
                    className="progress"
                    role="progressbar"
                    aria-label={`Progress toward ${reward.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                  >
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  {requested ? (
                    <span className="pill">⏳ Requested</span>
                  ) : (
                    <div className="row wrap">
                      <button type="button" className="btn primary" disabled={!canAfford} onClick={() => ask(reward)}>
                        Ask for it
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        disabled={!canAfford}
                        onClick={() => {
                          if (!settings.pinHash) notify('A grown-up needs to set a PIN in Parent mode first.');
                          else setPinFor(reward.id);
                        }}
                      >
                        Redeem now (PIN)
                      </button>
                    </div>
                  )}
                  {!canAfford && !requested && (
                    <span className="muted small">{reward.cost - Math.max(0, available)} more to go</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="week-title" className="card stack">
        <h2 id="week-title">My week</h2>
        <WeekStrip summary={summary} today={today} color={kid.color} />
        <p className="muted">
          {summary.choresApproved} chores approved · {summary.pointsEarned + summary.bonusPoints} points earned this week
        </p>
      </section>

      <p className="center">
        <a className="btn ghost" href={href('')}>
          ← Back to all kids
        </a>
      </p>

      <PinDialog
        open={pinFor !== null}
        title="Parent PIN needed"
        message="A grown-up enters the PIN to hand out this reward."
        settings={settings}
        onCancel={() => setPinFor(null)}
        onVerified={redeemWithPin}
      />
    </div>
  );
}
