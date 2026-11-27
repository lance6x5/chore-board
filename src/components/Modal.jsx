import { useEffect, useRef } from 'react';

/**
 * Accessible modal built on the native <dialog> element, which provides
 * focus trapping and Escape-to-close for free.
 */
export default function Modal({ open, onClose, labelledBy, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
