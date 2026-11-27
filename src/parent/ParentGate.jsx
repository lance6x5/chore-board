import { useState } from 'react';
import { createPinRecord, isValidPin, verifyPin } from '../lib/pin.js';
import { updateSettings } from '../lib/actions.js';

export const LOCK_NOTE =
  'The parent PIN is a light family lock to keep little fingers out, not real security. Anyone with access to this device could reset it.';

/** Create a PIN on first use, or ask for it to unlock the parent area. */
export default function ParentGate({ state, update, onUnlock }) {
  const hasPin = Boolean(state.settings.pinHash);
  return (
    <section className="card narrow stack" aria-labelledby="gate-title">
      {hasPin ? (
        <UnlockForm settings={state.settings} onUnlock={onUnlock} />
      ) : (
        <CreatePinForm update={update} onUnlock={onUnlock} />
      )}
      <p className="note">
        <span aria-hidden="true">ℹ️</span> {LOCK_NOTE}
      </p>
    </section>
  );
}

function UnlockForm({ settings, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (await verifyPin(pin, settings)) onUnlock();
    else {
      setError('Wrong PIN. Try again.');
      setPin('');
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h1 id="gate-title">Parent mode</h1>
      <label className="field">
        <span>Enter parent PIN</span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          autoFocus
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'gate-error' : undefined}
        />
      </label>
      {error && (
        <p className="error" id="gate-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn primary big" disabled={pin.length < 4}>
        Unlock
      </button>
      <details>
        <summary>Forgot the PIN?</summary>
        <p className="muted">
          Data lives only in this browser. To start over, clear this site's data in your browser settings (this
          erases everything). If you have a backup file, you can import it afterwards.
        </p>
      </details>
    </form>
  );
}

function CreatePinForm({ update, onUnlock }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!isValidPin(pin)) return setError('PIN must be 4 to 6 digits.');
    if (pin !== confirm) return setError('The two PINs do not match.');
    const record = await createPinRecord(pin);
    update((s) => updateSettings(s, record));
    onUnlock();
    return undefined;
  }

  const digits = (setter) => (e) => {
    setter(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  return (
    <form className="stack" onSubmit={submit}>
      <h1 id="gate-title">Create a parent PIN</h1>
      <p className="muted">Pick a 4 to 6 digit PIN. You'll use it to approve chores and hand out rewards.</p>
      <label className="field">
        <span>New PIN</span>
        <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={digits(setPin)} autoFocus />
      </label>
      <label className="field">
        <span>Confirm PIN</span>
        <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirm} onChange={digits(setConfirm)} />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn primary big">
        Save PIN and continue
      </button>
    </form>
  );
}
