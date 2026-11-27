import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import WeekStrip from '../components/WeekStrip.jsx';
import { addDays, formatDay } from '../lib/dates.js';
import { balance, currentStreak, weeklySummary } from '../lib/points.js';

/** Weekly summary per kid, with previous/next week navigation. */
export default function Summary({ state, today }) {
  const [offset, setOffset] = useState(0); // weeks back from current
  const ref = addDays(today, offset * 7);
  const first = state.kids[0] ? weeklySummary(state, state.kids[0].id, ref) : weeklySummary(state, '', ref);

  return (
    <div className="stack">
      <div className="row between wrap">
        <button type="button" className="btn ghost" onClick={() => setOffset((o) => o - 1)}>
          ← Previous week
        </button>
        <strong aria-live="polite">
          {formatDay(first.weekStart, { month: 'short', day: 'numeric' })} – {formatDay(first.weekEnd, { month: 'short', day: 'numeric' })}
        </strong>
        <button type="button" className="btn ghost" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0}>
          Next week →
        </button>
      </div>

      {state.kids.length === 0 ? (
        <p className="card empty">Add kids to see their weekly summary.</p>
      ) : (
        <ul className="summary-grid">
          {state.kids.map((kid) => {
            const s = weeklySummary(state, kid.id, ref);
            return (
              <li key={kid.id} className="card stack summary-card" style={{ '--kid': kid.color }}>
                <div className="row">
                  <Avatar kid={kid} />
                  <h2>{kid.name}</h2>
                </div>
                <WeekStrip summary={s} today={today} color={kid.color} />
                <dl className="summary-stats">
                  <div>
                    <dt>Chores approved</dt>
                    <dd>{s.choresApproved}</dd>
                  </div>
                  <div>
                    <dt>Points earned</dt>
                    <dd>{s.pointsEarned}</dd>
                  </div>
                  <div>
                    <dt>Bonus points</dt>
                    <dd>{s.bonusPoints}</dd>
                  </div>
                  <div>
                    <dt>Active days</dt>
                    <dd>{s.activeDays} / 7</dd>
                  </div>
                  <div>
                    <dt>Rewards redeemed</dt>
                    <dd>
                      {s.rewardsRedeemed} ({s.pointsSpent} pts)
                    </dd>
                  </div>
                  <div>
                    <dt>Still pending / rejected</dt>
                    <dd>
                      {s.choresPending} / {s.choresRejected}
                    </dd>
                  </div>
                  <div>
                    <dt>Balance now</dt>
                    <dd>{balance(state, kid.id)} pts</dd>
                  </div>
                  <div>
                    <dt>Current streak</dt>
                    <dd>{currentStreak(state, kid.id, today)} days</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
