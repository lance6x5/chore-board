import { WEEKDAY_SHORT, dayOfWeek, formatDay } from '../lib/dates.js';

/** Seven little bars showing approved chores per day for a week. */
export default function WeekStrip({ summary, today, color }) {
  const max = Math.max(1, ...summary.perDay.map((d) => d.count));
  return (
    <ol className="week-strip" style={{ '--kid': color }} aria-label="Chores approved each day this week">
      {summary.perDay.map((d) => (
        <li key={d.date} className={d.date === today ? 'is-today' : ''}>
          <span className="bar-wrap" aria-hidden="true">
            <span className="bar" style={{ height: `${(d.count / max) * 100}%` }} />
          </span>
          <span className="day-label">{WEEKDAY_SHORT[dayOfWeek(d.date)].slice(0, 2)}</span>
          <span className="sr-only">
            {formatDay(d.date)}: {d.count} chores, {d.points} points
          </span>
        </li>
      ))}
    </ol>
  );
}
