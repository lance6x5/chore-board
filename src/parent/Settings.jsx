import { useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { navigate } from '../hooks.js';
import { updateSettings } from '../lib/actions.js';
import { downloadJson, readBackupFile } from '../lib/exportImport.js';
import { createPinRecord, isValidPin, verifyPin } from '../lib/pin.js';
import { LOCK_NOTE } from './ParentGate.jsx';

/** Allowance, PIN, backup/restore and reset. */
export default function Settings({ state, update, replace, reset, notify }) {
  return (
    <div className="stack">
      <AllowanceSettings state={state} update={update} />
      <ChangePin state={state} update={update} notify={notify} />
      <DataSettings state={state} replace={replace} reset={reset} notify={notify} />
      <section className="card stack" aria-labelledby="about-title">
        <h2 id="about-title">About</h2>
        <p>
          Chore Champs v{__APP_VERSION__}. Everything is stored in this browser on this device only (IndexedDB). Use
          Export to back up or move to another device.
        </p>
      </section>
    </div>
  );
}

function AllowanceSettings({ state, update }) {
  const s = state.settings;
  return (
    <section className="card stack" aria-labelledby="allowance-title">
      <h2 id="allowance-title">Allowance</h2>
      <label className="check-chip">
        <input type="checkbox" checked={s.allowanceEnabled} onChange={(e) => update((st) => updateSettings(st, { allowanceEnabled: e.target.checked }))} />
        <span>Convert points to money</span>
      </label>
      {s.allowanceEnabled && (
        <div className="grid-2">
          <label className="field">
            <span>Points per 1 {s.currencySymbol}</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={s.pointsPerUnit}
              onChange={(e) => update((st) => updateSettings(st, { pointsPerUnit: Math.max(1, Math.round(Number(e.target.value) || 1)) }))}
            />
          </label>
          <label className="field">
            <span>Currency symbol</span>
            <input value={s.currencySymbol} maxLength={3} onChange={(e) => update((st) => updateSettings(st, { currencySymbol: e.target.value }))} />
          </label>
          <p className="muted small">
            Example: {s.pointsPerUnit} pts = {s.currencySymbol}1.00. Pay out from the Kids tab.
          </p>
        </div>
      )}
    </section>
  );
}

function ChangePin({ state, update, notify }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const digits = (setter) => (e) => {
    setter(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  async function submit(e) {
    e.preventDefault();
    if (!(await verifyPin(current, state.settings))) return setError('Current PIN is not right.');
    if (!isValidPin(next)) return setError('New PIN must be 4 to 6 digits.');
    if (next !== confirm) return setError('New PINs do not match.');
    const record = await createPinRecord(next);
    update((s) => updateSettings(s, record));
    setCurrent('');
    setNext('');
    setConfirm('');
    notify('PIN changed.');
    return undefined;
  }

  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="pin-title">
      <h2 id="pin-title">Change parent PIN</h2>
      <div className="grid-3">
        <label className="field">
          <span>Current PIN</span>
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={current} onChange={digits(setCurrent)} />
        </label>
        <label className="field">
          <span>New PIN</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={next} onChange={digits(setNext)} />
        </label>
        <label className="field">
          <span>Confirm new PIN</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirm} onChange={digits(setConfirm)} />
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="note small">{LOCK_NOTE}</p>
      <div>
        <button type="submit" className="btn primary" disabled={!current || !next || !confirm}>
          Change PIN
        </button>
      </div>
    </form>
  );
}

function DataSettings({ state, replace, reset, notify }) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await readBackupFile(file);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setPendingImport(result.state);
  }

  return (
    <section className="card stack" aria-labelledby="data-title">
      <h2 id="data-title">Your data</h2>
      <p className="muted">Data lives only on this device. Export a backup regularly, or to move to another tablet.</p>
      <div className="row wrap">
        <button type="button" className="btn primary" onClick={() => downloadJson(state)}>
          Export backup (JSON)
        </button>
        <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        <button type="button" className="btn danger" onClick={() => setConfirmReset(true)}>
          Reset all data
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace all data?"
        message={
          pendingImport
            ? `This backup has ${pendingImport.kids.length} kids, ${pendingImport.chores.length} chores and ${pendingImport.rewards.length} rewards. It will replace everything on this device, including the parent PIN.`
            : ''
        }
        confirmLabel="Import and replace"
        danger
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          replace(pendingImport);
          setPendingImport(null);
          notify('Backup imported.');
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This permanently deletes all kids, chores, rewards, history and the parent PIN from this device. Export a backup first if you might want it later."
        confirmLabel="Yes, delete everything"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await reset();
          notify('All data was reset.');
          navigate('');
        }}
      />
    </section>
  );
}
