import Modal from './Modal.jsx';

/** Simple yes/no confirmation dialog. */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title">
      <div className="stack">
        <h2 id="confirm-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
