import { useCallback, useEffect, useRef, useState } from 'react';
import { useHashRoute, useStore, useToday, href } from './hooks.js';
import Home from './components/Home.jsx';
import KidBoard from './components/KidBoard.jsx';
import Confetti from './components/Confetti.jsx';
import Feedback from './components/Feedback.jsx';
import VisitCount from './components/VisitCount.jsx';
import ParentGate from './parent/ParentGate.jsx';
import ParentArea from './parent/ParentArea.jsx';

const BASE = import.meta.env.BASE_URL;

export default function App() {
  const { state, update, replace, reset, saveFailed } = useStore();
  const route = useHashRoute();
  const today = useToday();
  const [unlocked, setUnlocked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const inParent = route[0] === 'parent';

  // Leaving the parent area always re-locks it.
  useEffect(() => {
    if (!inParent) setUnlocked(false);
  }, [inParent]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);

  const celebrate = useCallback(
    (msg) => {
      setBurst((n) => n + 1);
      if (msg) notify(msg);
    },
    [notify],
  );

  if (!state) {
    return (
      <div className="loading" role="status">
        <img src={`${BASE}logo.svg`} alt="" width="72" height="72" />
        <p>Loading Chore Champs...</p>
      </div>
    );
  }

  const ctx = { state, update, replace, reset, today, notify, celebrate };

  let view;
  if (route[0] === 'kid') {
    const kid = state.kids.find((k) => k.id === route[1]);
    view = kid ? <KidBoard {...ctx} kid={kid} /> : <Home {...ctx} />;
  } else if (inParent) {
    view = unlocked ? (
      <ParentArea {...ctx} tab={route[1] || 'approvals'} onLock={() => setUnlocked(false)} />
    ) : (
      <ParentGate {...ctx} onUnlock={() => setUnlocked(true)} />
    );
  } else {
    view = <Home {...ctx} />;
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <a className="brand" href={href('')} aria-label="Chore Champs home">
          <img src={`${BASE}logo.svg`} alt="" width="44" height="44" />
          <span className="brand-text">
            <span className="brand-name">Chore Champs</span>
            <span className="brand-tagline">Little helpers, big wins</span>
          </span>
        </a>
        <nav aria-label="Main" className="main-nav">
          <a href={href('')} className="nav-link" aria-current={!inParent ? 'page' : undefined}>
            <span aria-hidden="true">🏠</span> Kids
          </a>
          {inParent && unlocked ? (
            <button type="button" className="nav-link" onClick={() => setUnlocked(false)}>
              <span aria-hidden="true">🔒</span> Lock
            </button>
          ) : (
            <a href={href('parent')} className="nav-link" aria-current={inParent ? 'page' : undefined}>
              <span aria-hidden="true">🔑</span> Parent
            </a>
          )}
        </nav>
      </header>

      {saveFailed && (
        <p className="banner error" role="alert">
          Could not save to this browser's storage. Export a backup so you don't lose changes.
        </p>
      )}

      <main id="main" tabIndex={-1}>
        {view}
      </main>

      <footer className="app-footer">
        <span>Chore Champs v{__APP_VERSION__}</span>
        <span aria-hidden="true"> · </span>
        <span>Your chore data stays on this device.</span>
        <VisitCount />
        <Feedback />
      </footer>

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
      <Confetti burst={burst} />
    </>
  );
}
