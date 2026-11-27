import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { removeChore, saveChore } from '../lib/actions.js';
import { FREQUENCIES, describeFrequency } from '../lib/schedule.js';
import { WEEKDAY_LONG, WEEKDAY_SHORT } from '../lib/dates.js';

const CHORE_ICONS = ['⭐', '🛏️', '🧹', '🍽️', '🧺', '🐶', '🪴', '🗑️', '🦷', '📚', '🧸', '🚿', '🎒', '🍳', '🚗', '🧽'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

const blank = (today) => ({
  name: '',
  icon: '⭐',
  points: 5,
  kidIds: [],
  frequency: 'daily',
  weekdays: [1, 2, 3, 4, 5],
  date: today,
  active: true,
});

/** Create, edit and delete chores. */
export default function Chores({ state, update, today, notify }) {
  const [draft, setDraft] = useState(null); // chore being edited (null = closed)
  const [toDelete, setToDelete] = useState(null);
  const kidById = Object.fromEntries(state.kids.map((k) => [k.id, k]));

  return (
    <div className="stack">
      {draft ? (
        <ChoreForm
          key={draft.id || 'new'}
          initial={draft}
          kids={state.kids}
          onCancel={() => setDraft(null)}
          onSave={(chore) => {
            update((s) => saveChore(s, chore));
            notify(`Saved "${chore.name}".`);
            setDraft(null);
          }}
        />
      ) : (
        <div>
          <button type="button" className="btn primary" onClick={() => setDraft(blank(today))}>
            + Add chore
          </button>
        </div>
      )}

      {state.kids.length === 0 && <p className="note">Tip: add kids first so you can assign chores to them.</p>}

      {state.chores.length === 0 ? (
        <p className="card empty">No chores yet.</p>
      ) : (
        <ul className="list">
          {state.chores.map((c) => (
            <li key={c.id} className={`list-item ${c.active === false ? 'is-paused' : ''}`}>
              <span className="list-icon" aria-hidden="true">
                {c.icon || '⭐'}
              </span>
              <div className="grow">
                <strong>{c.name}</strong> {c.active === false && <span className="pill">Paused</span>}
                <div className="muted small">
                  {c.points} pts · {describeFrequency(c, WEEKDAY_SHORT)} ·{' '}
                  {c.kidIds.length ? c.kidIds.map((id) => kidById[id]?.name).filter(Boolean).join(', ') : 'Nobody assigned'}
                </div>
              </div>
              <div className="row">
                <button type="button" className="btn ghost small" onClick={() => setDraft(c)} aria-label={`Edit ${c.name}`}>
                  Edit
                </button>
                <button type="button" className="btn ghost small danger-text" onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete chore?"
        message={toDelete ? `"${toDelete.name}" will be removed. Points already approved are kept.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          update((s) => removeChore(s, toDelete.id));
          setToDelete(null);
        }}
      />
    </div>
  );
}

function ChoreForm({ initial, kids, onSave, onCancel }) {
  const [c, setC] = useState({ ...initial });
  const [error, setError] = useState('');
  const set = (patch) => {
    setC((prev) => ({ ...prev, ...patch }));
    setError('');
  };

  function toggle(list, value) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  function submit(e) {
    e.preventDefault();
    if (!c.name.trim()) return setError('Give the chore a name.');
    if (c.kidIds.length === 0) return setError('Assign the chore to at least one kid.');
    if (c.frequency === 'weekdays' && c.weekdays.length === 0) return setError('Pick at least one weekday.');
    onSave(c);
    return undefined;
  }

  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="chore-form-title">
      <h2 id="chore-form-title">{initial.id ? 'Edit chore' : 'New chore'}</h2>
      <div className="grid-2">
        <label className="field">
          <span>Chore name</span>
          <input value={c.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} required autoFocus />
        </label>
        <label className="field">
          <span>Points</span>
          <input type="number" min="0" max="1000" step="1" inputMode="numeric" value={c.points} onChange={(e) => set({ points: e.target.value })} required />
        </label>
      </div>

      <fieldset className="picker">
        <legend>Icon</legend>
        <div className="emoji-grid">
          {CHORE_ICONS.map((icon) => (
            <label key={icon} className="emoji-option">
              <input type="radio" name="chore-icon" value={icon} checked={c.icon === icon} onChange={() => set({ icon })} />
              <span aria-hidden="true">{icon}</span>
              <span className="sr-only">Icon {icon}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="picker">
        <legend>Assigned to</legend>
        {kids.length === 0 ? (
          <p className="muted">Add a kid first.</p>
        ) : (
          <div className="row wrap">
            {kids.map((k) => (
              <label key={k.id} className="check-chip" style={{ '--kid': k.color }}>
                <input type="checkbox" checked={c.kidIds.includes(k.id)} onChange={() => set({ kidIds: toggle(c.kidIds, k.id) })} />
                <span>
                  {k.avatar} {k.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="field">
        <span>How often</span>
        <select value={c.frequency} onChange={(e) => set({ frequency: e.target.value })}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      {c.frequency === 'weekdays' && (
        <fieldset className="picker">
          <legend>On these days</legend>
          <div className="row wrap">
            {WEEK_ORDER.map((d) => (
              <label key={d} className="check-chip">
                <input type="checkbox" checked={c.weekdays.includes(d)} onChange={() => set({ weekdays: toggle(c.weekdays, d) })} />
                <span>
                  <span aria-hidden="true">{WEEKDAY_SHORT[d]}</span>
                  <span className="sr-only">{WEEKDAY_LONG[d]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {c.frequency === 'once' && (
        <label className="field">
          <span>Show from date</span>
          <input type="date" value={c.date || ''} onChange={(e) => set({ date: e.target.value || null })} />
        </label>
      )}

      {c.frequency === 'weekly' && <p className="muted small">Shows every day until it's done once that week (weeks start Monday).</p>}

      <label className="check-chip">
        <input type="checkbox" checked={c.active !== false} onChange={(e) => set({ active: e.target.checked })} />
        <span>Active (uncheck to pause)</span>
      </label>

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
          Save chore
        </button>
      </div>
    </form>
  );
}
