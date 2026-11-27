import { useEffect, useState } from 'react';
import { formatVisits, getVisitCount } from '../lib/visits.js';

/** Small, muted anonymous visit count. Renders nothing until a value arrives (or on failure). */
export default function VisitCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let alive = true;
    getVisitCount().then((n) => {
      if (alive && n !== null) setCount(n);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <span className="visit-count" aria-live="polite" hidden={count === null}>
      {count !== null && (
        <>
          <span aria-hidden="true"> · </span>
          {`${formatVisits(count)} ${count === 1 ? 'visit' : 'visits'}`}
        </>
      )}
    </span>
  );
}
