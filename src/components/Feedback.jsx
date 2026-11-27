import { buildIssueUrl } from '../lib/feedback.js';

/** Footer feedback links that open pre-filled GitHub issue forms. */
export default function Feedback() {
  const info = {
    version: __APP_VERSION__,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
  return (
    <details className="feedback">
      <summary>Feedback</summary>
      <div className="feedback-body">
        <ul className="row wrap feedback-links" aria-label="Feedback options">
          <li>
            <a className="btn ghost small" href={buildIssueUrl('bug', info)} target="_blank" rel="noopener noreferrer">
              🐞 Report a bug<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a className="btn ghost small" href={buildIssueUrl('feature', info)} target="_blank" rel="noopener noreferrer">
              💡 Request a feature<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
        <p className="small muted">Opens GitHub — a free GitHub account is required. Don't include personal data.</p>
      </div>
    </details>
  );
}
