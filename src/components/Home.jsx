import Avatar from './Avatar.jsx';
import { href } from '../hooks.js';
import { balance, currentStreak } from '../lib/points.js';
import { choresForKid } from '../lib/schedule.js';

/** Kid picker: big tiles, one per kid. */
export default function Home({ state, today }) {
  if (state.kids.length === 0) {
    return (
      <section className="card welcome stack">
        <h1>Welcome to Chore Champs!</h1>
        <p>
          Kids tap the chores they finish to earn points. A parent approves them and hands out rewards.
        </p>
        <ol className="steps">
          <li>Open <strong>Parent</strong> mode and create a PIN.</li>
          <li>Add your kids, their chores, and some rewards.</li>
          <li>Hand over the tablet and let the champs get to work!</li>
        </ol>
        <p>
          <a className="btn primary big" href={href('parent')}>
            Set up in Parent mode
          </a>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="who-title">
      <h1 id="who-title" className="center">
        Who's helping today?
      </h1>
      <ul className="kid-grid">
        {state.kids.map((kid) => {
          const items = choresForKid(state, kid.id, today);
          const left = items.filter((i) => i.status === 'todo' || i.status === 'rejected').length;
          const streak = currentStreak(state, kid.id, today);
          return (
            <li key={kid.id}>
              <a className="kid-tile" href={href(`kid/${kid.id}`)} style={{ '--kid': kid.color }}>
                <Avatar kid={kid} size="xl" />
                <span className="kid-tile-name">{kid.name}</span>
                <span className="kid-tile-meta">
                  <span>
                    <span aria-hidden="true">⭐</span> {balance(state, kid.id)} pts
                  </span>
                  {streak > 0 && (
                    <span>
                      <span aria-hidden="true">🔥</span> {streak} day{streak === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <span className="kid-tile-left">
                  {items.length === 0 ? 'No chores today' : left === 0 ? 'All done today!' : `${left} to do`}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
