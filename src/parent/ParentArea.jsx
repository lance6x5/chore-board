import { href } from '../hooks.js';
import Approvals from './Approvals.jsx';
import Chores from './Chores.jsx';
import Kids from './Kids.jsx';
import Rewards from './Rewards.jsx';
import Summary from './Summary.jsx';
import Settings from './Settings.jsx';

const TABS = [
  { id: 'approvals', label: 'Approvals', icon: '✅', Component: Approvals },
  { id: 'chores', label: 'Chores', icon: '🧹', Component: Chores },
  { id: 'kids', label: 'Kids', icon: '🧒', Component: Kids },
  { id: 'rewards', label: 'Rewards', icon: '🎁', Component: Rewards },
  { id: 'summary', label: 'Weekly summary', icon: '📊', Component: Summary },
  { id: 'settings', label: 'Settings', icon: '⚙️', Component: Settings },
];

/** Parent admin dashboard with tabbed sections (hash routed). */
export default function ParentArea(props) {
  const { state, tab } = props;
  const current = TABS.find((t) => t.id === tab) || TABS[0];
  const pendingCount =
    state.completions.filter((c) => c.status === 'pending').length +
    state.redemptions.filter((r) => r.status === 'requested').length;
  const { Component } = current;

  return (
    <div className="parent">
      <nav className="tabs" aria-label="Parent sections">
        {TABS.map((t) => (
          <a key={t.id} href={href(`parent/${t.id}`)} className="tab" aria-current={t.id === current.id ? 'page' : undefined}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
            {t.id === 'approvals' && pendingCount > 0 && (
              <span className="badge" aria-label={`${pendingCount} waiting`}>
                {pendingCount}
              </span>
            )}
          </a>
        ))}
      </nav>
      <section className="parent-panel" aria-labelledby="panel-title">
        <h1 id="panel-title">{current.label}</h1>
        <Component {...props} />
      </section>
    </div>
  );
}
