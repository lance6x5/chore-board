import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { removeReward, saveReward } from '../lib/actions.js';
import { REWARD_ICONS } from '../lib/data.js';

const EXAMPLES = [
  { name: '30 min screen time', icon: '🎮', cost: 20 },
  { name: 'Pick dinner', icon: '🍕', cost: 50 },
];

/** Define rewards with point costs. */
export default function Rewards({ state, update, notify }) {
  const [draft, setDraft] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="stack">
      {draft ? (
        <RewardForm
          key={draft.id || 'new'}
          initial={draft}
          onCancel={() => setDraft(null)}
          onSave={(r) => {
            update((s) => saveReward(s, r));
            notify(`Saved "${r.name}".`);
            setDraft(null);
          }}
        />
      ) : (
        <div className="row wrap">
          <button type="button" className="btn primary" onClick={() => setDraft({ name: '', icon: '🎁', cost: 20 })}>
            + Add reward
          </button>
          {state.rewards.length === 0 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => update((s) => EXAMPLES.reduce((acc, r) => saveReward(acc, r), s))}
            >
              Add example rewards
            </button>
          )}
        </div>
      )}

      {state.rewards.length === 0 ? (
        <p className="card empty">No rewards yet.</p>
      ) : (
        <ul className="list">
          {state.rewards.map((r) => (
            <li key={r.id} className="list-item">
              <span className="list-icon" aria-hidden="true">
                {r.icon}
              </span>
              <div className="grow">
                <strong>{r.name}</strong>
                <div className="muted small">{r.cost} pts</div>
              </div>
              <div className="row">
                <button type="button" className="btn ghost small" onClick={() => setDraft(r)} aria-label={`Edit ${r.name}`}>
                  Edit
                </button>
                <button type="button" className="btn ghost small danger-text" onClick={() => setToDelete(r)} aria-label={`Delete ${r.name}`}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete reward?"
        message={toDelete ? `"${toDelete.name}" will be removed. Open requests for it are cancelled.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          update((s) => removeReward(s, toDelete.id));
          setToDelete(null);
        }}
      />
    </div>
  );
}

function RewardForm({ initial, onSave, onCancel }) {
  const [r, setR] = useState({ ...initial });
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!r.name.trim()) return setError('Give the reward a name.');
    if (!(Number(r.cost) >= 1)) return setError('Cost must be at least 1 point.');
    onSave(r);
    return undefined;
  }

  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="reward-form-title">
      <h2 id="reward-form-title">{initial.id ? 'Edit reward' : 'New reward'}</h2>
      <div className="grid-2">
        <label className="field">
          <span>Reward</span>
          <input value={r.name} maxLength={80} onChange={(e) => setR({ ...r, name: e.target.value })} required autoFocus />
        </label>
        <label className="field">
          <span>Cost (points)</span>
          <input type="number" min="1" step="1" inputMode="numeric" value={r.cost} onChange={(e) => setR({ ...r, cost: e.target.value })} required />
        </label>
      </div>
      <fieldset className="picker">
        <legend>Icon</legend>
        <div className="emoji-grid">
          {REWARD_ICONS.map((icon) => (
            <label key={icon} className="emoji-option">
              <input type="radio" name="reward-icon" value={icon} checked={r.icon === icon} onChange={() => setR({ ...r, icon })} />
              <span aria-hidden="true">{icon}</span>
              <span className="sr-only">Icon {icon}</span>
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
          Save reward
        </button>
      </div>
    </form>
  );
}
