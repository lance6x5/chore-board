import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import { resolveRedemption, reviewCompletion } from '../lib/actions.js';
import { formatDay } from '../lib/dates.js';
import { balance } from '../lib/points.js';

/** Queue of chore completions and reward requests waiting for a parent. */
export default function Approvals({ state, update, notify, celebrate }) {
  const [bonus, setBonus] = useState({});
  const kidById = Object.fromEntries(state.kids.map((k) => [k.id, k]));
  const choreById = Object.fromEntries(state.chores.map((c) => [c.id, c]));

  const pending = state.completions
    .filter((c) => c.status === 'pending' && kidById[c.kidId])
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const requests = state.redemptions.filter((r) => r.status === 'requested' && kidById[r.kidId]);

  function review(c, approve) {
    const extra = approve ? Number(bonus[c.id]) || 0 : 0;
    update((s) => reviewCompletion(s, c.id, approve, extra));
    const kid = kidById[c.kidId];
    const name = choreById[c.choreId]?.name || 'chore';
    if (approve) celebrate(`Approved "${name}" for ${kid.name}! +${c.points + extra} pts`);
    else notify(`Sent "${name}" back to ${kid.name} to try again.`);
  }

  function approveAll() {
    update((s) => pending.reduce((acc, c) => reviewCompletion(acc, c.id, true, Number(bonus[c.id]) || 0), s));
    celebrate(`Approved ${pending.length} chores!`);
  }

  function resolve(r, approve) {
    let error = null;
    update((s) => {
      const res = resolveRedemption(s, r.id, approve);
      error = res.error;
      return res.state;
    });
    if (error) notify(error);
    else if (approve) celebrate(`${kidById[r.kidId].name} gets "${r.rewardName}"!`);
    else notify(`Declined "${r.rewardName}". Points were not spent.`);
  }

  if (pending.length === 0 && requests.length === 0) {
    return <p className="card empty">Nothing waiting. All caught up! ☕</p>;
  }

  return (
    <div className="stack">
      {pending.length > 0 && (
        <section className="stack" aria-labelledby="pending-title">
          <div className="row between wrap">
            <h2 id="pending-title">Chores to check ({pending.length})</h2>
            {pending.length > 1 && (
              <button type="button" className="btn primary" onClick={approveAll}>
                Approve all
              </button>
            )}
          </div>
          <ul className="list">
            {pending.map((c) => {
              const kid = kidById[c.kidId];
              const chore = choreById[c.choreId];
              const bonusId = `bonus-${c.id}`;
              return (
                <li key={c.id} className="list-item" style={{ '--kid': kid.color }}>
                  <Avatar kid={kid} />
                  <div className="grow">
                    <strong>{chore ? `${chore.icon || ''} ${chore.name}` : 'Deleted chore'}</strong>
                    <div className="muted small">
                      {kid.name} · {formatDay(c.date)} · {c.points} pts
                    </div>
                  </div>
                  <label className="field inline" htmlFor={bonusId}>
                    <span>Bonus</span>
                    <input
                      id={bonusId}
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={bonus[c.id] ?? ''}
                      placeholder="0"
                      onChange={(e) => setBonus((b) => ({ ...b, [c.id]: e.target.value }))}
                    />
                  </label>
                  <div className="row">
                    <button type="button" className="btn success" onClick={() => review(c, true)}>
                      Approve
                    </button>
                    <button type="button" className="btn ghost" onClick={() => review(c, false)}>
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {requests.length > 0 && (
        <section className="stack" aria-labelledby="requests-title">
          <h2 id="requests-title">Reward requests ({requests.length})</h2>
          <ul className="list">
            {requests.map((r) => {
              const kid = kidById[r.kidId];
              return (
                <li key={r.id} className="list-item" style={{ '--kid': kid.color }}>
                  <Avatar kid={kid} />
                  <div className="grow">
                    <strong>{r.rewardName}</strong>
                    <div className="muted small">
                      {kid.name} · costs {r.cost} pts · has {balance(state, kid.id)} pts
                    </div>
                  </div>
                  <div className="row">
                    <button type="button" className="btn success" onClick={() => resolve(r, true)}>
                      Redeem
                    </button>
                    <button type="button" className="btn ghost" onClick={() => resolve(r, false)}>
                      Decline
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
