import { useState } from 'react';
import Modal from './Modal.jsx';
import { verifyPin } from '../lib/pin.js';

/** Asks for the parent PIN and calls onVerified() when it matches. */
export default function PinDialog({ open, title, message, settings, onCancel, onVerified }) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="pin-dialog-title">
      <PinForm title={title} message={message} settings={settings} onCancel={onCancel} onVerified={onVerified} />
    </Modal>
  );
}

function PinForm({ title, message, settings, onCancel, onVerified }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await verifyPin(pin, settings);
    setBusy(false);
    if (ok) {
      setPin('');
      onVerified();
    } else {
      setError('That PIN is not right. Try again.');
      setPin('');
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <h2 id="pin-dialog-title">{title}</h2>
      {message && <p className="muted">{message}</p>}
      <label className="field">
        <span>Parent PIN</span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          autoFocus
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'pin-dialog-error' : undefined}
        />
      </label>
      {error && (
        <p id="pin-dialog-error" className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={busy || pin.length < 4}>
          Unlock
        </button>
      </div>
    </form>
  );
}
