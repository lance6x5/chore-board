import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { addKid, payOut, removeKid, updateKid } from '../lib/actions.js';
import { AVATARS, KID_COLORS } from '../lib/data.js';
import { balance, bestStreak, currentStreak, formatMoney, pointsToMoney } from '../lib/points.js';

/** Manage kid profiles and (optionally) pay out allowance. */
export default function Kids({ state, update, today, notify }) {
  const [draft, setDraft] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const { settings } = state;

  return (
    <div className="stack">
      {draft ? (
        <KidForm
          key={draft.id || 'new'}
          initial={draft}
          onCancel={() => setDraft(null)}
          onSave={(kid) => {
            update((s) => (kid.id ? updateKid(s, kid.id, kid) : addKid(s, kid)));
            notify(`Saved ${kid.name}.`);
            setDraft(null);
          }}
        />
      ) : (
        <div>
          <button
            type="button"
            className="btn primary"
            onClick={() =>
              setDraft({
                name: '',
                avatar: AVATARS[state.kids.length % AVATARS.length],
                color: KID_COLORS[state.kids.length % KID_COLORS.length],
              })
            }
          >
            + Add kid
          </button>
        </div>
      )}

      {state.kids.length === 0 ? (
        <p className="card empty">No kids yet.</p>
      ) : (
        <ul className="list">
          {state.kids.map((k) => {
            const pts = balance(state, k.id);
            return (
              <li key={k.id} className="list-item wrap" style={{ '--kid': k.color }}>
                <Avatar kid={k} />
                <div className="grow">
                  <strong>{k.name}</strong>
                  <div className="muted small">
                    {pts} pts
                    {settings.allowanceEnabled && ` (${formatMoney(pointsToMoney(pts, settings), settings)})`} · streak{' '}
                    {currentStreak(state, k.id, today)} · best {bestStreak(state, k.id)}
                  </div>
                </div>
                {settings.allowanceEnabled && <PayoutForm kid={k} state={state} update={update} notify={notify} />}
                <div className="row">
                  <button type="button" className="btn ghost small" onClick={() => setDraft(k)} aria-label={`Edit ${k.name}`}>
                    Edit
                  </button>
                  <button type="button" className="btn ghost small danger-text" onClick={() => setToDelete(k)} aria-label={`Delete ${k.name}`}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete kid profile?"
        message={toDelete ? `${toDelete.name} and all of their history, points and rewards will be removed.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          update((s) => removeKid(s, toDelete.id));
          setToDelete(null);
        }}
      />
    </div>
  );
}

function PayoutForm({ kid, state, update, notify }) {
  const [points, setPoints] = useState('');
  const id = `payout-${kid.id}`;
  function submit(e) {
    e.preventDefault();
    let error = null;
    update((s) => {
      const r = payOut(s, kid.id, points);
      error = r.error;
      return r.state;
    });
    if (error) notify(error);
    else {
      notify(`Paid ${kid.name} ${formatMoney(pointsToMoney(Number(points), state.settings), state.settings)}.`);
      setPoints('');
    }
  }
  return (
    <form className="row" onSubmit={submit}>
      <label className="field inline" htmlFor={id}>
        <span>Cash out pts</span>
        <input id={id} type="number" min="1" step="1" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
      </label>
      <button type="submit" className="btn ghost small" disabled={!points}>
        Pay out
      </button>
    </form>
  );
}

function KidForm({ initial, onSave, onCancel }) {
  const [k, setK] = useState({ ...initial });
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!k.name.trim()) return setError('Enter a name.');
    onSave({ ...k, name: k.name.trim() });
    return undefined;
  }

  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="kid-form-title">
      <div className="row">
        <Avatar kid={k} size="lg" />
        <h2 id="kid-form-title">{initial.id ? `Edit ${initial.name}` : 'New kid'}</h2>
      </div>
      <label className="field">
        <span>Name</span>
        <input value={k.name} maxLength={40} onChange={(e) => { setK({ ...k, name: e.target.value }); setError(''); }} required autoFocus />
      </label>
      <fieldset className="picker">
        <legend>Avatar</legend>
        <div className="emoji-grid">
          {AVATARS.map((a) => (
            <label key={a} className="emoji-option">
              <input type="radio" name="kid-avatar" value={a} checked={k.avatar === a} onChange={() => setK({ ...k, avatar: a })} />
              <span aria-hidden="true">{a}</span>
              <span className="sr-only">Avatar {a}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="picker">
        <legend>Color</legend>
        <div className="row wrap">
          {KID_COLORS.map((c, i) => (
            <label key={c} className="color-option" style={{ '--swatch': c }}>
              <input type="radio" name="kid-color" value={c} checked={k.color === c} onChange={() => setK({ ...k, color: c })} />
              <span className="swatch" aria-hidden="true" />
              <span className="sr-only">Color {i + 1}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          Save
        </button>
      </div>
    </form>
  );
}
